use crate::{
    domain::{AudioStream, Chapter, ContainerInfo, SubtitleStream, VideoStream},
    ffprobe,
};

#[tauri::command]
pub async fn get_container_info(
    app: tauri::AppHandle,
    video_path: &str,
) -> Result<ContainerInfo, String> {
    let mut ffprobe = ffprobe::FFPROBE::new(&app)?;
    ffprobe.get_container_info(video_path).await
}

#[tauri::command]
pub async fn get_video_streams(
    app: tauri::AppHandle,
    video_path: &str,
) -> Result<Vec<VideoStream>, String> {
    let mut ffprobe = ffprobe::FFPROBE::new(&app)?;
    ffprobe.get_video_streams(video_path).await
}

#[tauri::command]
pub async fn get_audio_streams(
    app: tauri::AppHandle,
    video_path: &str,
) -> Result<Vec<AudioStream>, String> {
    let mut ffprobe = ffprobe::FFPROBE::new(&app)?;
    ffprobe.get_audio_streams(video_path).await
}

#[tauri::command]
pub async fn get_subtitle_streams(
    app: tauri::AppHandle,
    video_path: &str,
) -> Result<Vec<SubtitleStream>, String> {
    let mut ffprobe = ffprobe::FFPROBE::new(&app)?;
    ffprobe.get_subtitle_streams(video_path).await
}

#[tauri::command]
pub async fn get_chapters(app: tauri::AppHandle, video_path: &str) -> Result<Vec<Chapter>, String> {
    let mut ffprobe = ffprobe::FFPROBE::new(&app)?;
    ffprobe.get_chapters(video_path).await
}
