import { useRef } from 'react'
import { toast } from 'sonner'
import { useSnapshot } from 'valtio'

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
          <div>
            <VideoPreview videoIndex={videoIndex} />
          </div>
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

  const ref = useRef<VideoPlayerRef | null>(null)

  const {
    state: { videos },
  } = useSnapshot(appProxy)
  const video = videos.length > 0 ? videos[videoIndex] : null
  const { path } = video ?? {}

  return (
    <VideoPlayer
      ref={ref}
      src={path!}
      controls={false}
      playPauseOnSpaceKeydown
      onError={() => {
        toast.error('Could not load video. Switching to image thumbnail.')
        appProxy.state.videos[videoIndex].previewMode = 'image'
      }}
      autoFocus
      className="max-w-[65vw] max-h-[65vh] xxl:max-w-[75vw] "
    />
  )
}

export default VideoThumbnail
