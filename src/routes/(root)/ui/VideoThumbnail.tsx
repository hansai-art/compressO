import { useSnapshot } from 'valtio'

import Image from '@/components/Image'
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
  const { config, thumbnailPath, isProcessCompleted } = video ?? {}
  const { shouldTransformVideo } = config ?? {}

  return shouldTransformVideo && !isProcessCompleted ? (
    <VideoTransformer videoIndex={videoIndex} />
  ) : (
    <Image
      alt="video to compress"
      src={thumbnailPath as string}
      className="max-w-[65vw] xxl:max-w-[75vw] max-h-[60vh] object-contain rounded-3xl border-primary border-4"
    />
  )
}

export default VideoThumbnail
