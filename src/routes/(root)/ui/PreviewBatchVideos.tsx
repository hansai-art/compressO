import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useMemo } from 'react'
import { useSnapshot } from 'valtio'

import Card from '@/components/Card'
import Divider from '@/components/Divider'
import Icon from '@/components/Icon'
import Image from '@/components/Image'
import Progress, { CircularProgress } from '@/components/Progress'
import ScrollShadow from '@/components/ScrollShadow'
import { zoomInStaggerAnimation } from '@/utils/animation'
import { formatBytes } from '@/utils/fs'
import { cn } from '@/utils/tailwind'
import { appProxy } from '../-state'

function PreviewBatchVideos() {
  const {
    state: {
      videos,
      isCompressing,
      currentVideoIndex,
      totalProgress,
      totalSelectedFilesCount,
      isLoadingFiles,
    },
  } = useSnapshot(appProxy)

  const stats = useMemo(() => {
    const totalVideos = videos.length
    const totalSize = videos.reduce((sum, v) => sum + (v.sizeInBytes ?? 0), 0)

    if (isCompressing) {
      const completedVideos = videos.filter(
        (v) => v.isProcessCompleted && v.compressedVideo?.sizeInBytes,
      )
      const compressedCount = completedVideos.length
      const originalSize = completedVideos.reduce(
        (sum, v) => sum + (v.sizeInBytes ?? 0),
        0,
      )
      const compressedSize = completedVideos.reduce(
        (sum, v) => sum + (v.compressedVideo?.sizeInBytes ?? 0),
        0,
      )
      const sizeSaved = originalSize - compressedSize
      const percentageSaved =
        originalSize > 0 ? (sizeSaved / originalSize) * 100 : 0

      return {
        totalVideos,
        totalSize,
        compressedCount,
        sizeSaved,
        percentageSaved,
        totalProgress,
      }
    }

    return { totalVideos, totalSize }
  }, [videos, isCompressing, totalProgress])

  const handleRemoveVideo = useCallback(
    (index: number) => {
      if (isCompressing) return
      appProxy.state.videos = appProxy.state.videos.filter(
        (_, i) => i !== index,
      )
    },
    [isCompressing],
  )

  return (
    <>
      <ScrollShadow
        className="h-[80vh] overflow-hidden overflow-y-auto"
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
            {videos.map((video, index) => (
              <motion.div
                key={video.id}
                layout
                variants={zoomInStaggerAnimation.item}
                className={cn([
                  'relative rounded-xl border-zinc-300 dark:border-zinc-800 overflow-hidden',
                  isCompressing ? 'opacity-50' : '',
                ])}
              >
                <Card
                  className={cn(
                    'border-2 bg-zinc-100 dark:bg-zinc-900',
                    currentVideoIndex > index
                      ? 'border-green-400'
                      : 'border-primary',
                  )}
                  radius="lg"
                >
                  <div className="relative">
                    {video.thumbnailPath ? (
                      <Image
                        src={video.thumbnailPath as string}
                        alt={video.fileName ?? ''}
                        className="w-full aspect-video object-cover drop-shadow-xl"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                        <Icon
                          name="videoFile"
                          size={40}
                          className="text-zinc-400"
                        />
                      </div>
                    )}
                    {!isCompressing ? (
                      <button
                        onClick={() => handleRemoveVideo(index)}
                        className="absolute top-2 right-2 z-10 p-2 rounded-full bg-zinc-800/80 text-white hover:bg-zinc-700 transition-colors"
                      >
                        <Icon name="cross" size={20} />
                      </button>
                    ) : null}
                    {isCompressing && currentVideoIndex === index ? (
                      <>
                        <CircularProgress
                          size="lg"
                          showValueLabel
                          className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
                          value={video.compressionProgress ?? 20}
                          strokeWidth={3}
                          classNames={{
                            svg: 'w-20 h-20 drop-shadow-md',
                            track: 'dark:stroke-white/50',
                            value: 'font-bold text-sm text-white1',
                          }}
                          aria-label="Compressing"
                        />
                        <div className="absolute inset-0 bg-black/70 z-10 rounded-lg"></div>
                      </>
                    ) : null}
                  </div>
                  <div className="px-3 py-2">
                    <p
                      className={cn([
                        'font-medium text-sm truncate block',
                        isCompressing ? 'text-gray-500' : '',
                      ])}
                    >
                      {video.fileName ?? ''}
                    </p>
                    <div className="flex justify-around items-center gap-2 mt-2 text-[12px]">
                      <div>
                        <p className="italic text-gray-600 dark:text-gray-400 mb-1">
                          Size
                        </p>
                        <span className="block font-black">{video.size}</span>
                      </div>{' '}
                      <Divider orientation="vertical" className="h-5" />
                      <div>
                        <p className="italic text-gray-600 dark:text-gray-400 mb-1">
                          Extension
                        </p>
                        <span className="block font-black">
                          {video.extension ?? '-'}
                        </span>
                      </div>
                      {video.videDurationRaw ? (
                        <>
                          <Divider orientation="vertical" className="h-5" />
                          <div>
                            <p className="italic text-gray-600 dark:text-gray-400 mb-1">
                              Duration
                            </p>
                            <span className="block font-black">
                              {video.videDurationRaw ?? '-'}
                            </span>
                          </div>
                        </>
                      ) : null}
                      {video.dimensions ? (
                        <>
                          <Divider orientation="vertical" className="h-5" />
                          <div>
                            <p className="italic text-gray-600 dark:text-gray-400 mb-1">
                              Dimensions
                            </p>
                            <span className="block font-black">
                              {video.dimensions.width ?? '-'} x{' '}
                              {video.dimensions.height ?? '-'}
                            </span>
                          </div>
                        </>
                      ) : null}
                      {video.fps ? (
                        <>
                          <Divider orientation="vertical" className="h-5" />
                          <div>
                            <div>
                              <p className="italic text-gray-600 dark:text-gray-400 mb-1">
                                FPS
                              </p>
                              <span className="block font-black">
                                {video.fps ?? '-'}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </ScrollShadow>
      <section className="relative px-4 py-6 flex flex-col items-center">
        {isLoadingFiles ? (
          <Progress
            size="sm"
            isIndeterminate={totalSelectedFilesCount == null}
            className="w-[100px] mb-2 absolute top-2 right-1/2 translate-x-1/2"
            value={(videos.length * 100) / (totalSelectedFilesCount || 1)}
          />
        ) : null}
        <div className="max-w-7xl mx-auto">
          {isCompressing ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[12px] italic text-gray-600 dark:text-gray-400">
                    Videos Compressed
                  </p>
                  <p className="font-black text-lg">
                    {stats.compressedCount} / {stats.totalVideos}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] italic text-gray-600 dark:text-gray-400">
                    Size Saved
                  </p>
                  <p className="font-black text-lg text-green-600 dark:text-green-400">
                    {formatBytes(stats.sizeSaved ?? 0)} (
                    {(stats.percentageSaved ?? 0).toFixed(1)}%)
                  </p>
                </div>
              </div>
              <div className="flex-1 max-w-md">
                <p className="text-[12px] italic text-gray-600 dark:text-gray-400 mb-1">
                  Total Progress
                </p>
                <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.totalProgress ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div>
                <p className="italic text-gray-600 dark:text-gray-400">
                  Total Videos
                </p>
                <p
                  className={cn(
                    'font-black text-lg',
                    isLoadingFiles ? 'animate-pulse' : '',
                  )}
                >
                  {stats.totalVideos}
                </p>
              </div>
              <Divider orientation="vertical" className="h-8" />
              <div>
                <p className="italic text-gray-600 dark:text-gray-400">
                  Total Size
                </p>
                <p
                  className={cn(
                    'font-black text-lg',
                    isLoadingFiles ? 'animate-pulse' : '',
                  )}
                >
                  {formatBytes(stats.totalSize)}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default PreviewBatchVideos
