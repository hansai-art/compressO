import { core } from '@tauri-apps/api'
import { useEffect, useRef } from 'react'
import { Cropper, CropperRef, type CropperState } from 'react-advanced-cropper'
import 'react-advanced-cropper/dist/style.css'
import { useSnapshot } from 'valtio'

import Button from '@/components/Button'
import Divider from '@/components/Divider'
import Icon from '@/components/Icon'
import Tooltip from '@/components/Tooltip'
import { VideoTransforms, VideoTransformsHistory } from '@/types/compression'
import { appProxy } from '../-state'

type VideoTransformerProps = {
  mediaIndex: number
}

function VideoTransformer({ mediaIndex }: VideoTransformerProps) {
  if (mediaIndex < 0) return

  const {
    state: { media },
  } = useSnapshot(appProxy)
  const video =
    media.length > 0 && media[mediaIndex].type === 'video'
      ? media[mediaIndex]
      : null
  const { config, thumbnailPathRaw } = video ?? {}
  const { shouldTransformVideo } = config ?? {}

  const cropperRef = useRef<CropperRef>(null)
  const debouncedRef = useRef<NodeJS.Timeout | null>(null)

  const recordTransformHistory = (action: VideoTransformsHistory) => {
    const targetVideo = appProxy.state.media[mediaIndex]
    if (!targetVideo || !targetVideo.config || targetVideo.type !== 'video')
      return

    const transformsHistory =
      targetVideo.config?.transformVideoConfig?.transformsHistory ?? []

    transformsHistory.push(action)

    if (targetVideo?.config?.transformVideoConfig) {
      targetVideo.config.transformVideoConfig.transformsHistory =
        transformsHistory
    } else {
      targetVideo.config.transformVideoConfig = {
        transforms: {
          crop: { width: 0, height: 0, top: 0, left: 0 },
          flip: { horizontal: false, vertical: false },
          rotate: 0,
        },
        transformsHistory,
      }
    }
  }

  const flip = (horizontal: boolean, vertical: boolean) => {
    if (cropperRef.current) {
      cropperRef.current.flipImage(horizontal, vertical)
      recordTransformHistory({ type: 'flip', value: { horizontal, vertical } })
    }
  }

  const resetZoom = () => {
    if (cropperRef.current) {
      cropperRef.current.zoomImage({
        factor: 0,
        center: { left: 0, top: 0 },
      })
      // This is related to crop so it's history will be recorded on `onChange` handler
    }
  }

  const rotate = (angle: number) => {
    if (cropperRef.current) {
      cropperRef.current.rotateImage(angle)
      recordTransformHistory({
        type: 'rotate',
        value: angle,
      })
      resetZoom()
    }
  }

  const expandCropArea = () => {
    if (cropperRef.current) {
      const visibleArea = cropperRef.current.getState()?.visibleArea
      if (visibleArea) {
        cropperRef.current.setCoordinates({
          top: 0,
          left: 0,
          width: visibleArea.width,
          height: visibleArea.height,
        })
      }
      // This is related to crop so it's history will be recorded on `onChange` handler
    }
  }

  const onChange = (cropper: CropperRef) => {
    const targetVideo = appProxy.state.media[mediaIndex]
    if (!targetVideo || !targetVideo.config || targetVideo.type !== 'video')
      return

    if (debouncedRef.current) {
      clearTimeout(debouncedRef.current)
    }
    debouncedRef.current = setTimeout(async () => {
      const cropperState = cropper.getState()
      if (cropperState) {
        const canvas = cropper.getCanvas()!
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png'),
        )
        if (targetVideo.config?.transformVideoConfig?.previewUrl) {
          URL.revokeObjectURL(
            targetVideo?.config?.transformVideoConfig?.previewUrl!,
          )
        }
        const coordinates = cropperState.coordinates
        const transforms = cropperState.transforms

        const transformsHistory =
          targetVideo.config.transformVideoConfig?.transformsHistory ?? []

        const newTransforms: VideoTransforms = {
          crop: {
            top: coordinates?.top!,
            left: coordinates?.left!,
            width: coordinates?.width!,
            height: coordinates?.height!,
          },
          rotate: transforms.rotate,
          flip: {
            horizontal: transforms.flip.horizontal,
            vertical: transforms.flip.vertical,
          },
        }

        if (
          JSON.stringify(
            targetVideo.config.transformVideoConfig?.transforms?.crop,
          ) !== JSON.stringify(newTransforms?.crop)
        ) {
          transformsHistory.push({
            type: 'crop',
            value: newTransforms.crop,
          })
        }

        targetVideo.config.transformVideoConfig = {
          transforms: newTransforms,
          previewUrl: URL.createObjectURL(blob!),
          transformsHistory,
        }
      }
    }, 500)
  }

  useEffect(() => {
    if (shouldTransformVideo && cropperRef.current) {
      cropperRef.current?.refresh?.()
    }
  }, [shouldTransformVideo])

  return video ? (
    <>
      <Cropper
        ref={cropperRef}
        src={core.convertFileSrc(thumbnailPathRaw!)}
        stencilProps={{
          grid: true,
        }}
        onChange={onChange}
        className="w-full h-full"
        boundaryClassName="max-w-full max-h-full w-full h-full object-contain"
        defaultCoordinates={(state: CropperState) => {
          const crop =
            appProxy.state.media[mediaIndex].type === 'video'
              ? appProxy.state.media[mediaIndex].config.transformVideoConfig
                  ?.transforms?.crop
              : null
          return {
            left: crop?.left ?? 0,
            top: crop?.top ?? 0,
            width: crop?.width ?? state.imageSize.width,
            height: crop?.height ?? state.imageSize.height,
          }
        }}
        defaultPosition={() => {
          const crop =
            appProxy.state.media[mediaIndex].type === 'video'
              ? appProxy.state.media[mediaIndex].config.transformVideoConfig
                  ?.transforms?.crop
              : null
          return {
            left: crop?.left ?? 0,
            top: crop?.top ?? 0,
          }
        }}
        defaultSize={(state: CropperState) => {
          const crop =
            appProxy.state.media[mediaIndex].type === 'video'
              ? appProxy.state.media[mediaIndex].config.transformVideoConfig
                  ?.transforms?.crop
              : null
          return {
            width: crop?.width ?? state.imageSize.width,
            height: crop?.height ?? state.imageSize.height,
          }
        }}
        defaultTransforms={() => {
          const transforms =
            appProxy.state.media[mediaIndex].type === 'video'
              ? appProxy.state.media[mediaIndex].config.transformVideoConfig
                  ?.transforms
              : null
          return {
            rotate: transforms?.rotate ?? 0,
            flip: {
              horizontal: transforms?.flip?.horizontal ?? false,
              vertical: transforms?.flip?.vertical ?? false,
            },
          }
        }}
      />
      <div className="mx-auto flex items-center justify-center gap-2 mt-4">
        <>
          <Button size="sm" isIconOnly onPress={() => rotate(-90)}>
            <Tooltip content="Rotate Left" aria-label="Rotate Left">
              <Icon name="rotateLeft" size={20} />
            </Tooltip>
          </Button>
          <Divider className="my-3 h-5" orientation="vertical" />
        </>
        <>
          <Button size="sm" isIconOnly onPress={() => flip(false, true)}>
            <Tooltip content="Flip Vertical" aria-label="Flip Vertical">
              <Icon name="flipVertical" size={20} />
            </Tooltip>
          </Button>{' '}
          <Divider className="my-3 h-5" orientation="vertical" />
        </>
        <>
          <Button size="sm" isIconOnly onPress={() => flip(true, false)}>
            <Tooltip content="Flip Horizontal" aria-label="Flip Horizontal">
              <Icon name="flipHorizontal" size={20} />
            </Tooltip>
          </Button>{' '}
          <Divider className="my-3 h-5" orientation="vertical" />
        </>{' '}
        <>
          <Button size="sm" isIconOnly onPress={resetZoom}>
            <Tooltip content="Reset Zoom" aria-label="Reset Zoom">
              <Icon name="zoom" size={20} />
            </Tooltip>
            <Divider className="my-3 h-5" orientation="vertical" />
          </Button>{' '}
          <Divider className="my-3 h-5" orientation="vertical" />
        </>
        <>
          <Button size="sm" isIconOnly onPress={expandCropArea}>
            <Tooltip content="Expand" aria-label="Expand">
              <Icon name="expand" size={20} />
            </Tooltip>
          </Button>
        </>
      </div>
    </>
  ) : null
}

export default VideoTransformer
