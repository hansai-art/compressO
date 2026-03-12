use crate::domain::{
    CustomEvents, GifCompressionMode, ImageBatchCompressionProgress, ImageBatchCompressionResult,
    ImageBatchIndividualCompressionResult, ImageCompressionConfig, ImageCompressionProgress,
    ImageCompressionResult, JpegCompressionMode, PngCompressionMode,
};
use crate::ffmpeg::FFMPEG;
use crate::fs::get_file_metadata;
use image::ImageReader;
use imagequant::{Attributes, Image};
use log::error;
use oxipng::{Options, StripChunks};
use shared_child::SharedChild;
use std::{
    path::{Path, PathBuf},
    process::{Command, Stdio},
    sync::Arc,
};
use tauri::{AppHandle, Emitter, Listener, Manager};
use tauri_plugin_shell::ShellExt;

pub const SUPPORTED_IMAGE_EXTENSIONS: [&str; 9] = [
    "png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff", "heic", "svg",
];

/// Main image compressor struct
pub struct ImageCompressor {
    app: AppHandle,
    jpegoptim: Command,
    gifsicle: Command,
    assets_dir: PathBuf,
    ffmpeg: FFMPEG,
}

impl ImageCompressor {
    pub fn new(app: &tauri::AppHandle) -> Result<Self, String> {
        // First, create the ffmpeg instance
        let ffmpeg = FFMPEG::new(app)?;

        // Initialize jpegoptim sidecar
        let jpegoptim = match app.shell().sidecar("compresso_jpegoptim") {
            Ok(command) => Command::from(command),
            Err(err) => return Err(format!("[jpegoptim-sidecar]: {:?}", err.to_string())),
        };

        // Initialize gifsicle sidecar
        let gifsicle = match app.shell().sidecar("compresso_gifsicle") {
            Ok(command) => Command::from(command),
            Err(err) => return Err(format!("[gifsicle-sidecar]: {:?}", err.to_string())),
        };

        let app_data_dir = match app.path().app_data_dir() {
            Ok(path_buf) => path_buf,
            Err(_) => {
                return Err(String::from(
                    "Application app directory is not setup correctly.",
                ));
            }
        };
        let assets_dir: PathBuf = [PathBuf::from(&app_data_dir), PathBuf::from("assets")]
            .iter()
            .collect();

        Ok(Self {
            app: app.to_owned(),
            jpegoptim,
            gifsicle,
            assets_dir,
            ffmpeg,
        })
    }

    /// Compresses a single image
    pub async fn compress_image(
        &mut self,
        image_path: &str,
        convert_to_extension: Option<&str>,
        quality: u8,
        image_id: &str,
        _batch_id: Option<&str>,
        strip_metadata: Option<bool>,
        png_compression_mode: Option<PngCompressionMode>,
        jpeg_compression_mode: Option<JpegCompressionMode>,
        gif_compression_mode: Option<GifCompressionMode>,
    ) -> Result<ImageCompressionResult, String> {
        let original_path = Path::new(image_path);
        if !original_path.exists() {
            return Err(String::from("Image file does not exist."));
        }

        let original_metadata = get_file_metadata(image_path)?;
        let original_size = original_metadata.size;

        // Get the file extension
        let extension = original_metadata.extension.to_lowercase();
        let output_extension = convert_to_extension.unwrap_or(&extension);

        let supported = SUPPORTED_IMAGE_EXTENSIONS
            .iter()
            .any(|&ext| ext == output_extension);
        if !supported {
            return Err(format!("Unsupported output format: {}", output_extension));
        }

        // Generate output filename
        let output_filename = format!("{}.{}", image_id, output_extension);
        let output_path: PathBuf = [self.assets_dir.clone(), PathBuf::from(&output_filename)]
            .iter()
            .collect();

        // First, compress the image in its original format
        let temp_output_path = match extension.as_str() {
            "png" => {
                self.compress_png(
                    image_path,
                    quality,
                    image_id,
                    png_compression_mode.unwrap_or(PngCompressionMode::Lossy),
                )
                .await?
            }
            "jpg" | "jpeg" => {
                self.compress_jpeg(
                    image_path,
                    quality,
                    image_id,
                    jpeg_compression_mode.unwrap_or(JpegCompressionMode::Lossy),
                )
                .await?
            }
            "webp" => self.compress_webp(image_path, quality, image_id).await?,
            "gif" => {
                let gif_mode = gif_compression_mode.unwrap_or(GifCompressionMode::Lossy);
                self.compress_gif(image_path, quality, image_id, gif_mode)
                    .await?
            }
            "svg" => {
                let svg_mode = gif_compression_mode.unwrap_or(GifCompressionMode::Lossy);
                self.compress_svg(image_path, quality, image_id, svg_mode)
                    .await?
            }
            "heic" | "bmp" | "tiff" => {
                // For these formats, we'll convert them directly to the output format
                output_path.clone()
            }
            _ => {
                return Err(format!(
                    "Unsupported source format: {}. Original file will be copied.",
                    extension
                ))
            }
        };

        // If format conversion is needed, use ffmpeg
        let temp_path_clone = temp_output_path.clone();
        let final_output_path =
            if convert_to_extension.is_some() && convert_to_extension.unwrap() != &extension {
                self.ffmpeg
                    .convert_image(
                        &temp_output_path,
                        &output_path,
                        output_extension,
                        quality,
                        strip_metadata.unwrap_or(true),
                    )
                    .await?
            } else {
                temp_output_path
            };

        // Clean up temp file if it's different from final output
        if temp_path_clone != final_output_path && temp_path_clone.exists() {
            std::fs::remove_file(&temp_path_clone).ok();
        }

        // Get compressed file metadata
        let compressed_metadata =
            get_file_metadata(&final_output_path.to_string_lossy().to_string())?;
        let compressed_size = compressed_metadata.size;

        let compression_ratio = if original_size > 0 {
            ((original_size - compressed_size) as f32 / original_size as f32) * 100.0
        } else {
            0.0
        };

        Ok(ImageCompressionResult {
            image_id: image_id.to_string(),
            file_name: output_filename,
            file_path: final_output_path.display().to_string(),
            file_metadata: Some(compressed_metadata),
            original_size,
            compressed_size,
            compression_ratio,
        })
    }

    /// Compresses a PNG image
    /// - Lossy: uses imagequant (pngquant) for quantization + compression
    /// - Lossless: uses oxipng for lossless optimization
    async fn compress_png(
        &mut self,
        image_path: &str,
        quality: u8,
        image_id: &str,
        compression_mode: PngCompressionMode,
    ) -> Result<PathBuf, String> {
        let output_filename = format!("{}.png", image_id);
        let output_path: PathBuf = [self.assets_dir.clone(), PathBuf::from(&output_filename)]
            .iter()
            .collect();

        // Load the image
        let img = ImageReader::open(image_path)
            .map_err(|e| e.to_string())?
            .decode()
            .map_err(|e| e.to_string())?;

        match compression_mode {
            PngCompressionMode::Lossy => {
                // Lossy compression using oxipng with color reduction
                // Note: PNG is inherently lossless, so "lossy" means reducing colors first
                let rgba_data = img.to_rgba8();
                let width = img.width();
                let height = img.height();

                // Create quantization attributes
                let mut attrs = Attributes::new();

                // Set quality (0-100 maps to pngquant's 0-100 scale)
                // Lower values = more aggressive quantization (smaller files, more artifacts)
                // Higher values = better quality (larger files, fewer artifacts)
                let min_quality = (100 - quality).max(0);
                let target_quality = (100 - quality + 10).min(100);
                attrs
                    .set_quality(min_quality, target_quality)
                    .map_err(|e| format!("imagequant set_quality error: {:?}", e))?;

                // Set speed (0-10, higher is faster but lower quality)
                let _ = attrs.set_speed(if quality > 70 { 1 } else { 3 });

                // Create Image from RGBA data - need to convert to Box<[RGBA]>
                use rgb::RGBA8;
                let pixels: Vec<RGBA8> = rgba_data
                    .as_raw()
                    .chunks_exact(4)
                    .map(|p| RGBA8 {
                        r: p[0],
                        g: p[1],
                        b: p[2],
                        a: p[3],
                    })
                    .collect();

                let mut qimage = Image::new(
                    &attrs,
                    pixels.into_boxed_slice(),
                    width as usize,
                    height as usize,
                    0.0,
                )
                .map_err(|e| format!("imagequant Image::new error: {:?}", e))?;

                // Quantize the image - returns QuantizationResult
                let mut quantization_result = attrs
                    .quantize(&mut qimage)
                    .map_err(|e| format!("imagequant quantize error: {:?}", e))?;

                // Get the remapped indices and palette
                let (_palette, indices) = quantization_result
                    .remapped(&mut qimage)
                    .map_err(|e| format!("imagequant remapped error: {:?}", e))?;

                // Create an indexed image and write with oxipng
                let palette_vec = quantization_result.palette_vec();
                let mut options = Options::default();
                options.deflate = oxipng::Deflaters::Libdeflater { compression: 9 };
                options.strip = StripChunks::Safe;
                options.optimize_alpha = true;

                // Create quantized RGBA buffer for oxipng
                let quantized_rgba: Vec<u8> = indices
                    .iter()
                    .map(|&idx| {
                        if let Some(&rgba) = palette_vec.get(idx as usize) {
                            [rgba.r, rgba.g, rgba.b, rgba.a]
                        } else {
                            [0, 0, 0, 255]
                        }
                    })
                    .flatten()
                    .collect();

                match oxipng::optimize_from_memory(&quantized_rgba, &options) {
                    Ok(optimized) => {
                        std::fs::write(&output_path, optimized).map_err(|e| e.to_string())?;
                    }
                    Err(e) => return Err(format!("PNG optimization failed: {}", e)),
                }
            }
            PngCompressionMode::Lossless => {
                // Lossless compression using oxipng
                let compression_level = match quality {
                    0..=30 => 1,  // Fast
                    31..=70 => 6, // Default
                    _ => 9,       // Maximum
                };

                let mut options = Options::default();
                options.deflate = oxipng::Deflaters::Libdeflater {
                    compression: compression_level,
                };
                options.strip = StripChunks::Safe;
                options.optimize_alpha = true;

                let rgba_data = img.to_rgba8();
                match oxipng::optimize_from_memory(&rgba_data, &options) {
                    Ok(optimized) => {
                        std::fs::write(&output_path, optimized).map_err(|e| e.to_string())?;
                    }
                    Err(e) => return Err(format!("PNG optimization failed: {}", e)),
                }
            }
        }

        Ok(output_path)
    }

    /// Compresses a JPEG image
    /// - Lossy: uses MozJPEG for lossy compression
    /// - Lossless: uses jpegoptim for lossless optimization
    async fn compress_jpeg(
        &mut self,
        image_path: &str,
        quality: u8,
        image_id: &str,
        compression_mode: JpegCompressionMode,
    ) -> Result<PathBuf, String> {
        let output_filename = format!("{}.jpg", image_id);
        let output_path: PathBuf = [self.assets_dir.clone(), PathBuf::from(&output_filename)]
            .iter()
            .collect();

        // Load the image
        let img = ImageReader::open(image_path)
            .map_err(|e| e.to_string())?
            .decode()
            .map_err(|e| e.to_string())?;

        match compression_mode {
            JpegCompressionMode::Lossy => {
                // Lossy compression using image crate with quality setting
                let jpeg_quality = quality.max(1).min(100) as u8;
                let mut output_file =
                    std::fs::File::create(&output_path).map_err(|e| e.to_string())?;
                let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(
                    &mut output_file,
                    jpeg_quality,
                );
                img.write_with_encoder(encoder).map_err(|e| e.to_string())?;

                // Apply jpegoptim for further optimization
                self.run_jpegoptim(&output_path, jpeg_quality).await?;
            }
            JpegCompressionMode::Lossless => {
                // Lossless compression using image crate + jpegoptim
                let mut output_file =
                    std::fs::File::create(&output_path).map_err(|e| e.to_string())?;
                let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(
                    &mut output_file,
                    100, // Use maximum quality for lossless
                );
                img.write_with_encoder(encoder).map_err(|e| e.to_string())?;

                // Apply jpegoptim for further optimization (strips metadata)
                self.run_jpegoptim(&output_path, 100).await?;
            }
        }

        Ok(output_path)
    }

    /// Runs jpegoptim on a JPEG file for additional optimization
    async fn run_jpegoptim(&mut self, file_path: &Path, quality: u8) -> Result<(), String> {
        let jpeg_quality = quality.max(1).min(100);

        let command = self
            .jpegoptim
            .args([
                "-m",
                &jpeg_quality.to_string(),
                "-o", // Overwrite
                "-q", // Quiet
                "--strip-all",
                file_path.to_str().unwrap(),
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        match SharedChild::spawn(command) {
            Ok(child) => {
                let cp = Arc::new(child);
                let cp_clone = cp.clone();

                // Wait for completion
                tokio::spawn(async move {
                    let _ = cp_clone.wait();
                });

                match cp.wait() {
                    Ok(status) if status.success() => Ok(()),
                    Ok(_) => Err(String::from("jpegoptim failed")),
                    Err(e) => Err(format!("jpegoptim error: {}", e)),
                }
            }
            Err(e) => Err(format!("Failed to run jpegoptim: {}", e)),
        }
    }

    /// Compresses a WebP image
    async fn compress_webp(
        &mut self,
        image_path: &str,
        quality: u8,
        image_id: &str,
    ) -> Result<PathBuf, String> {
        let output_filename = format!("{}.webp", image_id);
        let output_path: PathBuf = [self.assets_dir.clone(), PathBuf::from(&output_filename)]
            .iter()
            .collect();

        // Load the image
        let img = ImageReader::open(image_path)
            .map_err(|e| e.to_string())?
            .decode()
            .map_err(|e| e.to_string())?;

        let width = img.width();
        let height = img.height();
        let rgba: Vec<u8> = img.to_rgba8().into_raw();

        // Calculate WebP encoder quality (0.0-1.0 float)
        let encoder_quality = (quality as f32 / 100.0).clamp(0.0, 1.0);

        // Create WebP encoder
        let encoder = webp::Encoder::from_rgb(&rgba, width, height);
        let webp_data = encoder.encode(encoder_quality);

        std::fs::write(&output_path, webp_data.to_vec()).map_err(|e| e.to_string())?;

        Ok(output_path)
    }

    /// Compresses a GIF image
    async fn compress_gif(
        &mut self,
        image_path: &str,
        quality: u8,
        image_id: &str,
        compression_mode: GifCompressionMode,
    ) -> Result<PathBuf, String> {
        let output_filename = format!("{}.gif", image_id);
        let output_path: PathBuf = [self.assets_dir.clone(), PathBuf::from(&output_filename)]
            .iter()
            .collect();

        match compression_mode {
            GifCompressionMode::Lossy => {
                // Lossy compression using gifsicle
                // Quality (1-100) - lower values = more aggressive optimization
                let quality_param = quality.max(1).min(100);

                // Lossy flags - create owned Strings to avoid borrow issues
                let lossy_arg = format!("--lossy={}", quality_param);
                let output_path_str = output_path.to_str().unwrap().to_string();

                let command = self
                    .gifsicle
                    .args(["-o", &lossy_arg, "--verbose", image_path, &output_path_str])
                    .stdout(Stdio::piped())
                    .stderr(Stdio::piped());

                let child = SharedChild::spawn(command)
                    .map_err(|e| format!("Failed to run gifsicle: {}", e))?;
                let cp = Arc::new(child);

                match cp.wait() {
                    Ok(status) if status.success() => {}
                    Ok(_) => return Err(String::from("gifsicle failed")),
                    Err(e) => return Err(format!("gifsicle error: {}", e)),
                };
            }
            GifCompressionMode::Lossless => {
                // Lossless compression - just copy the file for now
                // TODO: Implement proper lossless GIF optimization using gif-encoder crate
                std::fs::copy(image_path, &output_path).map_err(|e| e.to_string())?;
            }
        }

        Ok(output_path)
    }

    /// Compresses an SVG image using basic SVG optimization
    async fn compress_svg(
        &mut self,
        image_path: &str,
        quality: u8,
        image_id: &str,
        _compression_mode: GifCompressionMode,
    ) -> Result<PathBuf, String> {
        let output_filename = format!("{}.svg", image_id);
        let output_path: PathBuf = [self.assets_dir.clone(), PathBuf::from(&output_filename)]
            .iter()
            .collect();

        let mut svg_content = std::fs::read_to_string(image_path).map_err(|e| e.to_string())?;

        // Basic SVG optimization
        // Remove comments
        if quality < 80 {
            svg_content = regex::Regex::new(r"<!--.*?-->")
                .map_err(|e| e.to_string())?
                .replace_all(&svg_content, "")
                .to_string();
        }

        // Remove unnecessary whitespace between tags
        svg_content = regex::Regex::new(r">\s+<")
            .map_err(|e| e.to_string())?
            .replace_all(&svg_content, "><")
            .to_string();

        // Remove XML declaration and DOCTYPE if present
        svg_content = regex::Regex::new(r"<\?xml[^>]*\?>")
            .map_err(|e| e.to_string())?
            .replace_all(&svg_content, "")
            .to_string();
        svg_content = regex::Regex::new(r"<!DOCTYPE[^>]*>")
            .map_err(|e| e.to_string())?
            .replace_all(&svg_content, "")
            .to_string();

        // Remove metadata elements for higher compression
        if quality < 70 {
            let metadata_re = regex::Regex::new(r"<(title|desc|metadata)[^>]*>.*?</\1>")
                .map_err(|e| e.to_string())?;
            svg_content = metadata_re.replace_all(&svg_content, "").to_string();
        }

        std::fs::write(&output_path, svg_content).map_err(|e| e.to_string())?;

        Ok(output_path)
    }

    /// Compresses images in batch
    pub async fn compress_images_batch(
        &mut self,
        batch_id: &str,
        images: Vec<ImageCompressionConfig>,
    ) -> Result<ImageBatchCompressionResult, String> {
        let mut results: std::collections::HashMap<String, ImageCompressionResult> =
            std::collections::HashMap::new();
        let total_count = images.len();

        for (index, image_config) in images.iter().enumerate() {
            let image_path = &image_config.image_path;
            let image_id = &image_config.image_id;
            let quality = image_config.quality;
            let convert_to_extension = image_config.convert_to_extension.as_deref();
            let strip_metadata = image_config.strip_metadata.unwrap_or(true);
            let png_compression_mode = image_config.png_compression_mode.clone();
            let jpeg_compression_mode = image_config.jpeg_compression_mode.clone();
            let gif_compression_mode = image_config.gif_compression_mode.clone();

            // Set up progress monitoring
            let app_clone = self.app.clone();
            let batch_id_clone = batch_id.to_string();
            let image_id_clone = image_id.clone();

            tokio::spawn(async move {
                if let Some(window) = app_clone.get_webview_window("main") {
                    let _ = window.clone().listen(
                        CustomEvents::ImageCompressionProgress.as_ref(),
                        move |evt| {
                            if let Ok(progress) =
                                serde_json::from_str::<ImageCompressionProgress>(evt.payload())
                            {
                                if progress.image_id == image_id_clone {
                                    let batch_progress = ImageBatchCompressionProgress {
                                        batch_id: batch_id_clone.to_owned(),
                                        current_index: index,
                                        total_count,
                                        image_progress: progress,
                                    };
                                    let _ = window.emit(
                                        CustomEvents::ImageBatchCompressionProgress.as_ref(),
                                        batch_progress,
                                    );
                                }
                            }
                        },
                    );
                }
            });

            // Compress the image
            match self
                .compress_image(
                    image_path,
                    convert_to_extension,
                    quality,
                    image_id,
                    Some(batch_id),
                    Some(strip_metadata),
                    png_compression_mode,
                    jpeg_compression_mode,
                    gif_compression_mode,
                )
                .await
            {
                Ok(result) => {
                    let image_id = result.image_id.clone();
                    results.insert(image_id.clone(), result.clone());

                    // Emit completion event
                    let app_clone2 = self.app.clone();
                    let batch_id_clone2 = batch_id.to_string();

                    tokio::spawn(async move {
                        if let Some(window) = app_clone2.get_webview_window("main") {
                            let individual_result = ImageBatchIndividualCompressionResult {
                                batch_id: batch_id_clone2,
                                result,
                            };
                            let _ = window.emit(
                                CustomEvents::ImageBatchIndividualCompressionCompletion.as_ref(),
                                individual_result,
                            );
                        }
                    });
                }
                Err(e) => {
                    error!("Failed to compress image at index {}: {}", index, e);
                }
            }
        }

        Ok(ImageBatchCompressionResult { results })
    }
}
