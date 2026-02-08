import { core } from '@tauri-apps/api'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useSnapshot } from 'valtio'
import { subscribeKey } from 'valtio/utils'

import Image from '@/components/Image'
import VideoPlayer, { VideoPlayerRef } from '@/components/VideoPlayer'
import VideoTrimmer, {
  rowIds,
  VideoTrimmerRef,
} from '@/components/VideoTrimmer'
import useTimelineEngine from '@/components/VideoTrimmer/useTimelineEngine'
import VideoTransformer from './VideoTransformer'
import { appProxy } from '../-state'

type VideoThumbnailProps = {
  videoIndex: number
}

function VideoThumbnail({ videoIndex }: VideoThumbnailProps) {
  if (videoIndex < 0) return

  const {
    state: { videos },
  } = useSnapshot(appProxy)
  const video = videos.length > 0 ? videos[videoIndex] : null
  const {
    config,
    path: videoPath,
    thumbnailPath,
    isProcessCompleted,
    previewMode = 'video',
    videoDurationMilliseconds,
    compressedVideo,
  } = video ?? {}
  const {
    shouldTransformVideo,
    isVideoTransformEditMode,
    trimConfig,
    isVideoTrimEditMode,
    shouldTrimVideo,
  } = config ?? {}

  const playerRef = useRef<VideoPlayerRef | null>(null)

  const trimmerRef = useRef<VideoTrimmerRef | null>(null)

  useEffect(() => {
    let unsubscribeTransform: (() => void) | undefined
    let unsubscribeTrim: (() => void) | undefined

    if (appProxy.state.videos[videoIndex]?.config) {
      unsubscribeTransform = subscribeKey(
        appProxy.state.videos[videoIndex].config,
        'isVideoTransformEditMode',
        async () => {
          if (
            playerRef.current &&
            appProxy.state.videos[videoIndex].config.isVideoTransformEditMode
          ) {
            const videoSnapshot = appProxy.state.videos[videoIndex]
            const originalThumbnail = core.convertFileSrc(
              videoSnapshot.thumbnailPathRaw!,
            )
            const url = await playerRef.current.captureVideoFrame()
            appProxy.state.videos[videoIndex].thumbnailPath =
              url ?? originalThumbnail
            playerRef.current.pauseVideo()
          }
        },
      )

      unsubscribeTrim = subscribeKey(
        appProxy.state.videos[videoIndex].config,
        'isVideoTrimEditMode',
        async () => {
          if (
            playerRef.current &&
            appProxy.state.videos[videoIndex].config.isVideoTrimEditMode
          ) {
            playerRef.current.pauseVideo()
          }
        },
      )
    }
    return () => {
      unsubscribeTransform?.()
      unsubscribeTrim?.()
    }
  }, [videoIndex])

  useTimelineEngine({
    timelineState: trimmerRef,
    totalDuration: 21,
    onPlay: () => {
      playerRef.current?.playVideo?.()
    },
    onPause: () => {
      playerRef.current?.pauseVideo?.()
    },
    onEnd: () => {
      playerRef.current?.pauseVideo?.()
    },
    onSeek: (time) => {
      if (playerRef.current?.playerRef && playerRef.current.playerRef.paused) {
        playerRef.current.playerRef.currentTime = time
      }
    },
    onTimeChange: (time) => {
      if (playerRef.current?.playerRef && playerRef.current.playerRef.paused) {
        playerRef.current.playerRef.currentTime = time
      }
    },
  })

  const showTrimmerLayout =
    shouldTrimVideo && isVideoTrimEditMode && !isProcessCompleted

  const showTransformerLayout =
    shouldTransformVideo && isVideoTransformEditMode && !isProcessCompleted

  return (
    <div className="relative w-full flex items-center justify-center">
      <div className="min-w-[40vw]">
        {previewMode === 'video' && videoPath ? (
          <VideoPlayer
            ref={playerRef}
            src={
              isProcessCompleted && compressedVideo
                ? compressedVideo?.path!
                : videoPath!
            }
            controls={false}
            playPauseOnSpaceKeydown
            autoFocus
            className="max-w-[65vw] max-h-[65vh] xxl:max-w-[75vw] mx-auto"
            onError={() => {
              toast.error('Could not load video. Switching to image thumbnail.')
              appProxy.state.videos[videoIndex].previewMode = 'image'
            }}
            onTimeUpdate={() => {
              if (playerRef.current?.playerRef) {
                const currentTime = playerRef.current.playerRef?.currentTime
                if (trimmerRef.current && !playerRef.current.playerRef.paused) {
                  trimmerRef.current?.setTime(currentTime)
                }
              }
            }}
          />
        ) : (
          <Image
            alt="video to compress"
            src={thumbnailPath as string}
            className="w-full h-full object-contain rounded-3xl max-w-[65vw] max-h-[65vh] xxl:max-w-[75vw]"
          />
        )}
        {showTrimmerLayout && videoDurationMilliseconds ? (
          <div className="mt-4">
            <VideoTrimmer
              id="video-trimmer-1"
              ref={trimmerRef}
              duration={videoDurationMilliseconds / 1000}
              {...(trimConfig
                ? {
                    startDuration: trimConfig.startTime,
                    endDuration: trimConfig.endTime,
                  }
                : {})}
              onActionResizing={(data) => {
                if (data.row.id === rowIds.videoTrim) {
                  if (playerRef.current?.playerRef) {
                    playerRef.current.playerRef.currentTime =
                      data.dir === 'left' ? data.start : data.end
                    if (
                      data.end > data.start &&
                      appProxy.state.videos[videoIndex]?.config
                    ) {
                      const videoConfig =
                        appProxy.state.videos[videoIndex].config
                      videoConfig.trimConfig = {
                        startTime: data.start,
                        endTime: data.end,
                      }
                    }
                  }
                }
              }}
            />
          </div>
        ) : null}
      </div>
      {showTransformerLayout ? (
        <div className="absolute top-0 right-0 bottom-0 left-0 w-full h-full flex flex-col m-auto justify-center items-center z-[10] bg-white1 dark:bg-black1">
          <VideoTransformer videoIndex={videoIndex} />
        </div>
      ) : null}
    </div>
  )
}

export default VideoThumbnail
