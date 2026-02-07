import { core } from '@tauri-apps/api'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useSnapshot } from 'valtio'
import { subscribeKey } from 'valtio/utils'

import Image from '@/components/Image'
import VideoPlayer, { VideoPlayerRef } from '@/components/VideoPlayer'
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
  } = video ?? {}
  const { shouldTransformVideo, isVideoTransformEditMode } = config ?? {}

  const showTransformerLayout =
    shouldTransformVideo && isVideoTransformEditMode && !isProcessCompleted

  return (
    <div className="relative w-full flex items-center justify-center">
      <>
        {previewMode === 'video' && videoPath ? (
          <VideoPreview videoIndex={videoIndex} />
        ) : (
          <Image
            alt="video to compress"
            src={thumbnailPath as string}
            className="w-full h-full object-contain rounded-3xl max-w-[65vw] max-h-[65vh] xxl:max-w-[75vw]"
          />
        )}
      </>
      {showTransformerLayout ? (
        <div className="absolute top-0 right-0 bottom-0 left-0 w-full h-full flex flex-col m-auto justify-center items-center z-[10] bg-white1 dark:bg-black1">
          <VideoTransformer videoIndex={videoIndex} />
        </div>
      ) : null}
    </div>
  )
}

type VideoPreviewProps = {
  videoIndex: number
}

function VideoPreview({ videoIndex }: VideoPreviewProps) {
  if (videoIndex < 0) return

  const playerRef = useRef<VideoPlayerRef | null>(null)

  const {
    state: { videos },
  } = useSnapshot(appProxy)
  const video = videos.length > 0 ? videos[videoIndex] : null
  const { path } = video ?? {}

  useEffect(() => {
    let unsubscribe: () => void
    if (appProxy.state.videos[videoIndex]?.config) {
      unsubscribe = subscribeKey(
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
    }
    return () => {
      unsubscribe?.()
    }
  }, [videoIndex])

  return (
    <VideoPlayer
      ref={playerRef}
      src={path!}
      controls={false}
      playPauseOnSpaceKeydown
      onError={() => {
        toast.error('Could not load video. Switching to image thumbnail.')
        appProxy.state.videos[videoIndex].previewMode = 'image'
      }}
      autoFocus
      className="max-w-[65vw] max-h-[65vh] xxl:max-w-[75vw] mx-auto"
    />
  )
}

export default VideoThumbnail
