import { SelectItem } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback } from 'react'
import { useSnapshot } from 'valtio'

import Select from '@/components/Select'
import Switch from '@/components/Switch'
import { slideDownTransition } from '@/utils/animation'
import { appProxy, normalizeBatchVideosConfig } from '../../-state'

const FPS = [24, 25, 30, 50, 60] as const

type VideoFPSProps = {
  mediaIndex: number
}

function VideoFPS({ mediaIndex }: VideoFPSProps) {
  const {
    state: {
      videos,
      isCompressing,
      isProcessCompleted,
      commonConfigForBatchCompression,
      isLoadingMediaFiles,
    },
  } = useSnapshot(appProxy)
  const video = videos.length > 0 && mediaIndex >= 0 ? videos[mediaIndex] : null
  const { config, fps } = video ?? {}
  const { shouldEnableCustomFPS, customFPS } =
    config ?? commonConfigForBatchCompression ?? {}

  const handleSwitchToggle = useCallback(() => {
    if (mediaIndex >= 0 && appProxy.state.videos[mediaIndex]?.config) {
      appProxy.state.videos[mediaIndex].config.shouldEnableCustomFPS =
        !shouldEnableCustomFPS
      appProxy.state.videos[mediaIndex].isConfigDirty = true
    } else {
      if (appProxy.state.videos.length > 1) {
        appProxy.state.commonConfigForBatchCompression.shouldEnableCustomFPS =
          !shouldEnableCustomFPS
        normalizeBatchVideosConfig()
      }
    }
  }, [mediaIndex, shouldEnableCustomFPS])

  const handleValueChange = useCallback(
    (value: number) => {
      if (mediaIndex >= 0 && appProxy.state.videos[mediaIndex]?.config) {
        appProxy.state.videos[mediaIndex].config.customFPS = +value
        appProxy.state.videos[mediaIndex].isConfigDirty = true
      } else {
        if (appProxy.state.videos.length > 1) {
          appProxy.state.commonConfigForBatchCompression.customFPS = +value
          normalizeBatchVideosConfig()
        }
      }
    },
    [mediaIndex],
  )

  const shouldDisableInput =
    videos.length === 0 ||
    isCompressing ||
    isProcessCompleted ||
    isLoadingMediaFiles

  const initialFpsValue = customFPS ?? fps ?? 30

  return (
    <>
      <Switch
        isSelected={shouldEnableCustomFPS}
        onValueChange={handleSwitchToggle}
        isDisabled={shouldDisableInput}
      >
        <p className="text-gray-600 dark:text-gray-400 text-sm mr-2 w-full font-bold">
          FPS
        </p>
      </Switch>
      <AnimatePresence mode="wait">
        {shouldEnableCustomFPS ? (
          <motion.div {...slideDownTransition}>
            <Select
              fullWidth
              label="Frames Per Second:"
              className="block flex-shrink-0 rounded-2xl !mt-8"
              selectedKeys={[String(initialFpsValue)!]}
              size="sm"
              value={String(initialFpsValue)}
              onChange={(evt) => {
                const value = evt?.target?.value
                if (value && !Number.isNaN(+value)) {
                  handleValueChange(+value)
                }
              }}
              selectionMode="single"
              isDisabled={!shouldEnableCustomFPS || shouldDisableInput}
              classNames={{
                label: '!text-gray-600 dark:!text-gray-400 text-xs',
              }}
            >
              {FPS?.map((f) => (
                <SelectItem
                  key={String(f)}
                  textValue={String(f)}
                  className="flex justify-center items-center"
                >
                  {String(f)}
                </SelectItem>
              ))}
            </Select>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

export default VideoFPS
