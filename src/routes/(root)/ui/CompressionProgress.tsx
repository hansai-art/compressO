import { core, event } from '@tauri-apps/api'
import { invoke } from '@tauri-apps/api/core'
import { useEffect, useRef } from 'react'
import { snapshot, useSnapshot } from 'valtio'

import {
  BatchCompressionIndividualCompressionResult,
  CustomEvents,
  VideoCompressionProgress,
} from '@/types/compression'
import { formatBytes } from '@/utils/fs'
import { convertDurationToMilliseconds } from '@/utils/string'
import { appProxy } from '../-state'

async function updateDockProgress() {
  const media = snapshot(appProxy).state.media
  if (media.length === 0) return

  const totalProgress = media.reduce(
    (sum, media) => sum + (media.compressionProgress ?? 0),
    0,
  )
  const batchProgress = totalProgress / media.length

  try {
    await invoke('set_dock_progress', { progress: batchProgress })
  } catch {
    // Silently fail on non-macOS platforms
  }
}

async function clearDockProgress() {
  try {
    await invoke('clear_dock_badge')
  } catch {
    // Silently fail on non-macOS platforms
  }
}

function CompressionProgress() {
  const {
    state: { batchId },
  } = useSnapshot(appProxy)

  const compressionProgressRef = useRef<event.UnlistenFn>()
  const individualCompressionResultRef = useRef<event.UnlistenFn>()

  useEffect(() => {
    // Batch compression progress
    if (batchId) {
      ;(async () => {
        if (compressionProgressRef.current) {
          compressionProgressRef.current?.()
        }
        compressionProgressRef.current =
          await event.listen<VideoCompressionProgress>(
            CustomEvents.VideoCompressionProgress,
            (evt) => {
              const payload = evt?.payload
              if (batchId === payload?.batchId) {
                const media = snapshot(appProxy).state.media
                const targetMediaIndex = media.findIndex(
                  (v) => v.id === payload.videoId, // TODO: handle for imageId
                )
                if (targetMediaIndex !== -1) {
                  appProxy.state.currentMediaIndex = targetMediaIndex
                  appProxy.state.media[targetMediaIndex].isCompressing = true
                  const mediaType = appProxy.state.media[targetMediaIndex].type

                  if (media[targetMediaIndex].type === 'video') {
                    const trimConfig =
                      media[targetMediaIndex]?.config?.trimConfig ?? []

                    const targetVideoDuration =
                      media[targetMediaIndex].videoDuration ?? 0

                    const videoDurationInMilliseconds =
                      (media[targetMediaIndex]?.config?.shouldTrimVideo &&
                      trimConfig
                        ? (trimConfig.reduce((a, c) => {
                            a += c.end >= c.start ? c.end - c.start : 0
                            return a
                          }, 0) ?? targetVideoDuration)
                        : targetVideoDuration) * 1000

                    if (!Number.isNaN(videoDurationInMilliseconds)) {
                      const currentDurationInMilliseconds =
                        convertDurationToMilliseconds(payload?.currentDuration) // current duration is the duration processed on the output not input source

                      if (
                        currentDurationInMilliseconds > 0 &&
                        videoDurationInMilliseconds >=
                          currentDurationInMilliseconds
                      ) {
                        appProxy.state.media[
                          targetMediaIndex
                        ].compressionProgress =
                          (currentDurationInMilliseconds * 100) /
                          videoDurationInMilliseconds

                        updateDockProgress()
                      }
                    }
                  } else if (mediaType === 'image') {
                    // TODO: Handle image
                  }
                }
              }
            },
          )
      })()

      // Individual compression progress
      ;(async () => {
        if (individualCompressionResultRef.current) {
          individualCompressionResultRef.current?.()
        }
        individualCompressionResultRef.current =
          await event.listen<BatchCompressionIndividualCompressionResult>(
            CustomEvents.BatchCompressionIndividualCompressionCompletion,
            (evt) => {
              const payload = evt?.payload
              if (batchId === payload?.batchId && payload?.result) {
                const media = snapshot(appProxy).state.media
                const targetMediaIndex = media.findIndex(
                  (v) => v.id === payload.result.videoId, // TODO: handle for imageId
                )
                if (targetMediaIndex !== -1) {
                  const fileMetadata = payload?.result?.fileMetadata
                  appProxy.state.media[targetMediaIndex].isProcessCompleted =
                    true
                  appProxy.state.media[targetMediaIndex].isCompressing = false
                  appProxy.state.media[targetMediaIndex].compressionProgress =
                    100
                  appProxy.state.media[targetMediaIndex].compressedFile = {
                    isSuccessful: true,
                    fileName: fileMetadata?.fileName,
                    fileNameToDisplay: `${fileMetadata?.fileName?.slice(
                      0,
                      -((fileMetadata?.extension?.length ?? 0) + 1),
                    )}.${fileMetadata?.extension}`,
                    pathRaw: fileMetadata?.path,
                    path: core.convertFileSrc(fileMetadata?.path ?? ''),
                    mimeType: fileMetadata?.extension,
                    extension: fileMetadata?.extension,
                    size: formatBytes(fileMetadata?.size ?? 0),
                    sizeInBytes: fileMetadata?.size,
                  }
                  if (appProxy.state.media.length > 1) {
                    appProxy.takeSnapshot('batchCompressionStep')
                  }

                  const allMediaCompleted = snapshot(
                    appProxy,
                  ).state?.media?.every((v) => v.isProcessCompleted)
                  if (allMediaCompleted) {
                    clearDockProgress()
                  } else {
                    updateDockProgress()
                  }
                }
              }
            },
          )
      })()
    }

    return () => {
      compressionProgressRef.current?.()
      individualCompressionResultRef.current?.()
      clearDockProgress()
    }
  }, [batchId])

  return null
}

export default CompressionProgress
