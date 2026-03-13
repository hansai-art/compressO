import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useMemo } from 'react'
import { useSnapshot } from 'valtio'

import Button from '@/components/Button'
import Card from '@/components/Card'
import Divider from '@/components/Divider'
import Icon from '@/components/Icon'
import Image from '@/components/Image'
import Progress, { CircularProgress } from '@/components/Progress'
import ScrollShadow from '@/components/ScrollShadow'
import { toast } from '@/components/Toast'
import Tooltip from '@/components/Tooltip'
import { copyFileToClipboard, showItemInFileManager } from '@/tauri/commands/fs'
import { zoomInStaggerAnimation } from '@/utils/animation'
import { formatBytes } from '@/utils/fs'
import { formatDuration } from '@/utils/string'
import { cn } from '@/utils/tailwind'
import { appProxy } from '../-state'

function PreviewBatchMedia() {
  const {
    state: {
      media,
      isCompressing,
      isProcessCompleted,
      currentMediaIndex,
      totalSelectedMediaCount,
      isLoadingMediaFiles,
      isBatchCompressionCancelled,
    },
  } = useSnapshot(appProxy)

  const compressionStats = useMemo(() => {
    const totalMedia = media.length
    const totalVideos = media.reduce(
      (a, m) => a + (m.type === 'video' ? 1 : 0),
      0,
    )
    const totalImages = media.reduce(
      (a, m) => a + (m.type === 'image' ? 1 : 0),
      0,
    )
    const totalSize = media.reduce((sum, m) => sum + (m.sizeInBytes ?? 0), 0)

    const completedMedia = media.filter(
      (m) => m.isProcessCompleted && m.compressedFile?.sizeInBytes,
    )
    const compressedMediaCount = completedMedia.length
    const cancelledMediaCount = isBatchCompressionCancelled
      ? totalMedia - compressedMediaCount
      : 0
    const cancelledVideosCount = isBatchCompressionCancelled
      ? totalVideos - completedMedia.filter((m) => m.type === 'video').length
      : 0
    const cancelledImagesCount = isBatchCompressionCancelled
      ? totalVideos - completedMedia.filter((m) => m.type === 'image').length
      : 0

    const originalSizeOfCompressedOnly = completedMedia.reduce((sum, m) => {
      const cs = m.compressedFile?.sizeInBytes
      const os = m.sizeInBytes ?? 0

      return sum + (cs != null && cs < os ? os : 0)
    }, 0)
    const outputSize = completedMedia.reduce((sum, v) => {
      const cs = v.compressedFile?.sizeInBytes
      return sum + (cs != null ? cs : 0)
    }, 0)
    const compressedSize = completedMedia.reduce((sum, v) => {
      const cs = v.compressedFile?.sizeInBytes
      const os = v.sizeInBytes ?? 0

      return sum + (cs != null && cs < os ? cs : 0)
    }, 0)
    const sizeSaved = originalSizeOfCompressedOnly - compressedSize
    const percentageSaved =
      originalSizeOfCompressedOnly > 0
        ? (sizeSaved / originalSizeOfCompressedOnly) * 100
        : 0

    const totalProgress = media.reduce(
      (a, c) => a + (c?.compressionProgress ?? 0) / media.length,
      0,
    )

    const displayTotalMedia = isBatchCompressionCancelled
      ? compressedMediaCount
      : totalMedia
    const displayTotalVideos = isBatchCompressionCancelled
      ? completedMedia.filter((m) => m.type === 'video').length
      : totalVideos
    const displayTotalImages = isBatchCompressionCancelled
      ? completedMedia.filter((m) => m.type === 'image').length
      : totalImages
    const displayTotalSize = isBatchCompressionCancelled
      ? completedMedia.reduce((sum, v) => sum + (v.sizeInBytes ?? 0), 0)
      : totalSize

    return {
      totalMedia,
      totalVideos,
      totalImages,
      totalSize,
      compressedMediaCount,
      compressedSize,
      outputSize,
      sizeSaved,
      percentageSaved,
      totalProgress,
      cancelledMediaCount,
      cancelledVideosCount,
      cancelledImagesCount,
      displayTotalMedia,
      displayTotalVideos,
      displayTotalImages,
      displayTotalSize,
      isPositiveCompression:
        (compressedSize ?? Number.MAX_SAFE_INTEGER) < (totalSize ?? 0),
    }
  }, [media, isBatchCompressionCancelled])

  const handleRemoveMedia = useCallback(
    (index: number) => {
      if (isCompressing) return
      appProxy.state.media = appProxy.state.media.filter((_, i) => i !== index)
    },
    [isCompressing],
  )

  const handleOpenInFileManager = useCallback(async (savedPath: string) => {
    try {
      await showItemInFileManager(savedPath)
    } catch {}
  }, [])

  const handleCopyToClipboard = useCallback(async (savedPath: string) => {
    try {
      await copyFileToClipboard(savedPath)
      toast.success('Copied to clipboard.')
    } catch {}
  }, [])

  return (
    <>
      <ScrollShadow
        className="h-[75vh] hlg:h-[80vh] overflow-hidden overflow-y-auto"
        hideScrollBar
      >
        <AnimatePresence mode="wait">
          <motion.div
            variants={zoomInStaggerAnimation.container}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 gap-4"
          >
            {media.map((mediaFile, index) => {
              const compressedSizeDiff =
                typeof mediaFile?.compressedFile?.sizeInBytes === 'number' &&
                typeof mediaFile?.sizeInBytes === 'number' &&
                !Number.isNaN(mediaFile?.sizeInBytes)
                  ? (((mediaFile?.sizeInBytes ?? 0) -
                      (mediaFile?.compressedFile?.sizeInBytes ?? 0)) *
                      100) /
                    mediaFile?.sizeInBytes
                  : 0

              const thumbnailPath =
                mediaFile.type === 'video'
                  ? mediaFile.thumbnailPath
                  : mediaFile.type === 'image'
                    ? mediaFile.path
                    : null

              return (
                <motion.div
                  key={mediaFile.id}
                  layout
                  variants={zoomInStaggerAnimation.item}
                  className={cn([
                    'relative rounded-xl border-2 overflow-hidden',
                    currentMediaIndex > index || mediaFile.isProcessCompleted
                      ? 'border-green-400'
                      : 'border-zinc-200 dark:border-zinc-900',
                  ])}
                >
                  <Card
                    className={cn(
                      'bg-zinc-100/5 dark:bg-zinc-900 rounded-none overflow-hidden',
                    )}
                    radius="lg"
                  >
                    <div className="relative w-full overflow-hidden">
                      {thumbnailPath ? (
                        <>
                          <Image
                            src={thumbnailPath}
                            alt={mediaFile.fileName ?? ''}
                            className="w-full max-w-[unset] h-[180px] hlg:h-[220px] object-cover drop-shadow-xl rounded-xl"
                            removeWrapper
                          />
                          {mediaFile.type === 'video' ? (
                            <Icon
                              name="video"
                              size={40}
                              className="text-zinc-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10]"
                            />
                          ) : null}
                        </>
                      ) : (
                        <div className="w-full aspect-video bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                          <Icon
                            name="video"
                            size={40}
                            className="text-zinc-400"
                          />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 z-10 flex gap-2 items-center">
                        {!isCompressing &&
                        mediaFile?.isProcessCompleted &&
                        mediaFile?.compressedFile?.isSuccessful ? (
                          <Tooltip
                            content="Copy to clipboard"
                            aria-label="Copy to clipboard"
                          >
                            <Button
                              size="sm"
                              isIconOnly
                              onPress={() =>
                                handleCopyToClipboard(
                                  (mediaFile?.compressedFile?.savedPath ??
                                    mediaFile?.compressedFile
                                      ?.pathRaw) as string,
                                )
                              }
                              className="rounded-full text-white"
                            >
                              <Icon
                                name="copy"
                                size={28}
                                className="text-green-400"
                              />
                            </Button>
                          </Tooltip>
                        ) : null}
                        {mediaFile.isProcessCompleted &&
                        mediaFile?.compressedFile?.isSaved &&
                        mediaFile?.compressedFile?.savedPath ? (
                          <Tooltip
                            content="Show in File Explorer"
                            aria-label="Show in File Explorer"
                          >
                            <Button
                              size="sm"
                              isIconOnly
                              onPress={() =>
                                handleOpenInFileManager(
                                  mediaFile.compressedFile!.savedPath!,
                                )
                              }
                              className="p-2 rounded-full text-white"
                            >
                              <Icon
                                name="fileExplorer"
                                size={20}
                                className="text-green-400"
                              />
                            </Button>
                          </Tooltip>
                        ) : null}
                      </div>
                      {!isCompressing &&
                      !isProcessCompleted &&
                      !isLoadingMediaFiles ? (
                        <>
                          <Button
                            size="sm"
                            isIconOnly
                            onPress={() => handleRemoveMedia(index)}
                            className="absolute top-2 right-2 z-10 p-2 rounded-full bg-zinc-800/80 text-white hover:bg-zinc-700 transition-colors"
                          >
                            <Icon name="cross" size={18} />
                          </Button>
                          <Button
                            size="sm"
                            isIconOnly
                            onPress={() => {
                              appProxy.state.selectedMediaIndexForCustomization =
                                index
                            }}
                            className={cn(
                              'absolute bottom-2 left-2 z-10 rounded-full text-white hover:bg-zinc-700 transition-colors',
                              mediaFile.isConfigDirty
                                ? 'bg-primary'
                                : 'bg-zinc-800/80',
                            )}
                          >
                            <Icon name="pencil" size={20} />
                          </Button>
                        </>
                      ) : null}
                      {isCompressing && currentMediaIndex === index ? (
                        <>
                          <CircularProgress
                            size="lg"
                            showValueLabel
                            className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
                            value={mediaFile.compressionProgress ?? 0}
                            strokeWidth={3}
                            classNames={{
                              svg: 'w-20 h-20 drop-shadow-md',
                              track: 'dark:stroke-white/50',
                              value: 'font-bold text-sm text-white1',
                            }}
                            aria-label="Processing"
                          />
                          <div className="absolute inset-0 bg-black/70 z-10 rounded-lg"></div>
                        </>
                      ) : null}
                    </div>
                    <section className="px-3 py-2">
                      <p className={cn(['font-medium text-sm truncate block'])}>
                        {mediaFile.fileName ?? ''}
                      </p>
                      <Divider className="mt-2" />
                      <section
                        className={cn(
                          'flex items-center text-[12px] min-h-[55px]',
                          mediaFile.type === 'video' &&
                            !mediaFile?.compressedFile?.isSuccessful
                            ? 'justify-between gap-2'
                            : 'gap-4',
                        )}
                      >
                        {mediaFile.isProcessCompleted &&
                        mediaFile?.compressedFile?.isSuccessful ? (
                          <section className="animate-appearance-in w-full flex items-center justify-center gap-4">
                            <div className="flex justify-center items-center">
                              <p className="text-[16px] font-bold">
                                {mediaFile.size ?? ''}
                              </p>
                              <Icon
                                name="curvedArrow"
                                className="text-black dark:text-white rotate-[-65deg] translate-y-[-2px] mx-2"
                                size={40}
                              />
                              <p className="text-[16px] font-bold text-primary">
                                {mediaFile?.compressedFile?.size ?? ''}
                              </p>
                            </div>
                            {!(compressedSizeDiff <= 0) ? (
                              <>
                                <Divider
                                  orientation="vertical"
                                  className="h-5"
                                />
                                <p className="block text-center text-[16px] text-green-500">
                                  {compressedSizeDiff
                                    .toFixed(2)
                                    ?.endsWith('.00')
                                    ? compressedSizeDiff
                                        .toFixed(2)
                                        ?.slice(0, -3)
                                    : compressedSizeDiff.toFixed(2)}
                                  %<span> smaller</span>
                                </p>
                              </>
                            ) : null}
                          </section>
                        ) : (
                          <>
                            <div className="text-[11px] xl:text-[12px] xxl:text-[12px] 3xl:text-[12.5px]">
                              <p className=" text-gray-600 dark:text-gray-400 mb-1">
                                Size
                              </p>
                              <span className="block font-black">
                                {mediaFile.size}
                              </span>
                            </div>
                            <Divider orientation="vertical" className="h-5" />
                            <div className="text-[11px] xxl:text-[12px] 3xl:text-[12.5px]">
                              <p className=" text-gray-600 dark:text-gray-400 mb-1">
                                Extension
                              </p>
                              <span className="block font-black">
                                {mediaFile.extension ?? '-'}
                              </span>
                            </div>
                            {mediaFile.type === 'video' &&
                            mediaFile.videoDuration ? (
                              <>
                                <Divider
                                  orientation="vertical"
                                  className="h-5"
                                />
                                <div className="text-[11px] xxl:text-[12px] 3xl:text-[12.5px]">
                                  <p className=" text-gray-600 dark:text-gray-400 mb-1">
                                    Duration
                                  </p>
                                  <span className="block font-black">
                                    {formatDuration(mediaFile.videoDuration) ??
                                      '-'}
                                  </span>
                                </div>
                              </>
                            ) : null}
                            {mediaFile.dimensions ? (
                              <>
                                <Divider
                                  orientation="vertical"
                                  className="h-5"
                                />
                                <div className="text-[11px] xxl:text-[12px] 3xl:text-[12.5px]">
                                  <p className=" text-gray-600 dark:text-gray-400 mb-1">
                                    Dimensions
                                  </p>
                                  <span className="block font-black">
                                    {mediaFile.dimensions.width ?? '-'} x{' '}
                                    {mediaFile.dimensions.height ?? '-'}
                                  </span>
                                </div>
                              </>
                            ) : null}
                          </>
                        )}
                      </section>
                    </section>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </ScrollShadow>
      <section className="relative px-4 py-6 flex flex-col items-center">
        {isLoadingMediaFiles ? (
          <Progress
            size="sm"
            isIndeterminate={totalSelectedMediaCount == null}
            className="w-[100px] mb-2 absolute top-2 right-1/2 translate-x-1/2"
            value={(media.length * 100) / (totalSelectedMediaCount || 1)}
          />
        ) : null}
        <div className="max-w-7xl mx-auto">
          {isCompressing ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className=" text-gray-600 dark:text-gray-400">
                    Compressed
                  </p>
                  <p className="font-black text-lg">
                    {compressionStats?.compressedMediaCount ?? 0} /{' '}
                    {compressionStats?.totalMedia}
                  </p>
                </div>
                <Divider orientation="vertical" className="h-8" />
                <div>
                  <p className=" text-gray-600 dark:text-gray-400">Saved</p>
                  <p className="font-black text-lg text-green-600 dark:text-green-400">
                    {formatBytes(compressionStats.sizeSaved ?? 0) || '...'}
                    {compressionStats.percentageSaved
                      ? `(${(compressionStats.percentageSaved ?? 0).toFixed(0)}%)`
                      : null}
                  </p>
                </div>
              </div>
              <Divider orientation="vertical" className="h-8" />
              <div className="flex-1">
                <CircularProgress
                  showValueLabel
                  size="lg"
                  value={compressionStats.totalProgress ?? 0}
                  strokeWidth={4}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div>
                <p className=" text-gray-600 dark:text-gray-400">Media</p>
                <p
                  className={cn(
                    'font-black text-lg',
                    isLoadingMediaFiles ? 'animate-pulse' : '',
                  )}
                >
                  {compressionStats.displayTotalMedia}
                  {compressionStats.cancelledMediaCount > 0 ? (
                    <span className="text-xs  text-warning-400 ml-2">
                      ({compressionStats.cancelledMediaCount} cancelled)
                    </span>
                  ) : null}
                </p>
              </div>
              <Divider orientation="vertical" className="h-8" />
              <div>
                <p className=" text-gray-600 dark:text-gray-400">Videos</p>
                <p
                  className={cn(
                    'font-black text-lg',
                    isLoadingMediaFiles ? 'animate-pulse' : '',
                  )}
                >
                  {compressionStats.displayTotalVideos}
                  {compressionStats.cancelledVideosCount > 0 ? (
                    <span className="text-xs  text-warning-400 ml-2">
                      ({compressionStats.cancelledVideosCount} cancelled)
                    </span>
                  ) : null}
                </p>
              </div>
              <Divider orientation="vertical" className="h-8" />
              <div>
                <p className=" text-gray-600 dark:text-gray-400">Images</p>
                <p
                  className={cn(
                    'font-black text-lg',
                    isLoadingMediaFiles ? 'animate-pulse' : '',
                  )}
                >
                  {compressionStats.displayTotalImages}
                  {compressionStats.cancelledImagesCount > 0 ? (
                    <span className="text-xs  text-warning-400 ml-2">
                      ({compressionStats.cancelledImagesCount} cancelled)
                    </span>
                  ) : null}
                </p>
              </div>
              <Divider orientation="vertical" className="h-8" />
              <div>
                <p className=" text-gray-600 dark:text-gray-400">Size</p>
                <p
                  className={cn(
                    'font-black text-lg',
                    isLoadingMediaFiles ? 'animate-pulse' : '',
                  )}
                >
                  {formatBytes(compressionStats.displayTotalSize)}
                </p>
              </div>
              {isProcessCompleted ? (
                <>
                  <Divider orientation="vertical" className="h-8" />
                  <div>
                    <p className=" text-gray-600 dark:text-gray-400">
                      Output Size
                    </p>
                    <p
                      className={cn(
                        'font-black text-lg',
                        compressionStats.isPositiveCompression
                          ? 'text-green-600 dark:text-green-400'
                          : '',
                      )}
                    >
                      {formatBytes(compressionStats.outputSize ?? 0) || '-'}
                    </p>
                  </div>
                  <Divider orientation="vertical" className="h-8" />
                  <div>
                    <p className=" text-gray-600 dark:text-gray-400">Saved</p>
                    <p
                      className={cn(
                        'font-black text-lg',
                        compressionStats.isPositiveCompression
                          ? 'text-green-600 dark:text-green-400'
                          : '',
                      )}
                    >
                      {formatBytes(compressionStats.sizeSaved ?? 0) || '-'} (
                      {(compressionStats.percentageSaved ?? 0).toFixed(2)}%)
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default PreviewBatchMedia
