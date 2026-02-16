import { SelectItem } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback } from 'react'
import { useSnapshot } from 'valtio'

import Checkbox from '@/components/Checkbox'
import Divider from '@/components/Divider'
import Select from '@/components/Select'
import Switch from '@/components/Switch'
import { slideDownTransition } from '@/utils/animation'
import { appProxy, normalizeBatchVideosConfig } from '../../-state'

type AudioChannelsProps = {
  videoIndex: number
}

function AudioChannels({ videoIndex }: AudioChannelsProps) {
  const {
    state: {
      videos,
      isCompressing,
      isProcessCompleted,
      commonConfigForBatchCompression,
      isLoadingFiles,
    },
  } = useSnapshot(appProxy)
  const video = videos.length > 0 && videoIndex >= 0 ? videos[videoIndex] : null
  const { config, videoInfoRaw } = video ?? {}
  const { audioChannelConfig, audioVolume } =
    config ?? commonConfigForBatchCompression ?? {}

  const handleChannelLayoutChange = useCallback(
    (value: string) => {
      const newLayout =
        value === 'original' ? null : (value as 'mono' | 'stereo')

      if (videoIndex >= 0 && appProxy.state.videos[videoIndex]?.config) {
        const videoConfig = appProxy.state.videos[videoIndex].config
        if (newLayout === 'mono') {
          videoConfig.audioChannelConfig = {
            channelLayout: newLayout,
            monoSource: { left: true, right: true },
          }
        } else if (newLayout === 'stereo') {
          videoConfig.audioChannelConfig = {
            channelLayout: newLayout,
            stereoSwapChannels: false,
          }
        } else {
          videoConfig.audioChannelConfig = null
        }
        appProxy.state.videos[videoIndex].isConfigDirty = true
      } else {
        if (appProxy.state.videos.length > 1) {
          if (newLayout === 'mono') {
            appProxy.state.commonConfigForBatchCompression.audioChannelConfig =
              {
                channelLayout: newLayout,
                monoSource: { left: true, right: true },
              }
          } else if (newLayout === 'stereo') {
            appProxy.state.commonConfigForBatchCompression.audioChannelConfig =
              {
                channelLayout: newLayout,
                stereoSwapChannels: false,
              }
          } else {
            appProxy.state.commonConfigForBatchCompression.audioChannelConfig =
              null
          }
          normalizeBatchVideosConfig()
        }
      }
    },
    [videoIndex],
  )

  const handleMonoLeftChange = useCallback(
    (isSelected: boolean) => {
      if (videoIndex >= 0 && appProxy.state.videos[videoIndex]?.config) {
        const videoConfig = appProxy.state.videos[videoIndex].config
        if (!videoConfig.audioChannelConfig) {
          videoConfig.audioChannelConfig = {
            channelLayout: 'mono',
          }
        }
        if (
          videoConfig.audioChannelConfig &&
          !videoConfig.audioChannelConfig.monoSource
        ) {
          videoConfig.audioChannelConfig.monoSource = {
            left: true,
            right: true,
          }
        }
        videoConfig.audioChannelConfig.monoSource!.left = isSelected
        appProxy.state.videos[videoIndex].isConfigDirty = true
      } else {
        if (appProxy.state.videos.length > 1) {
          if (
            !appProxy.state.commonConfigForBatchCompression.audioChannelConfig
          ) {
            appProxy.state.commonConfigForBatchCompression.audioChannelConfig =
              {
                channelLayout: 'mono',
              }
          }
          if (
            !appProxy.state.commonConfigForBatchCompression.audioChannelConfig
              .monoSource
          ) {
            appProxy.state.commonConfigForBatchCompression.audioChannelConfig.monoSource =
              {
                left: true,
                right: true,
              }
          }
          appProxy.state.commonConfigForBatchCompression.audioChannelConfig
            .monoSource!.left = isSelected
          normalizeBatchVideosConfig()
        }
      }
    },
    [videoIndex],
  )

  const handleMonoRightChange = useCallback(
    (isSelected: boolean) => {
      if (videoIndex >= 0 && appProxy.state.videos[videoIndex]?.config) {
        const videoConfig = appProxy.state.videos[videoIndex].config
        if (!videoConfig.audioChannelConfig) {
          videoConfig.audioChannelConfig = {
            channelLayout: 'mono',
          }
        }
        if (!videoConfig.audioChannelConfig.monoSource) {
          videoConfig.audioChannelConfig.monoSource = {
            left: true,
            right: true,
          }
        }
        videoConfig.audioChannelConfig.monoSource!.right = isSelected
        appProxy.state.videos[videoIndex].isConfigDirty = true
      } else {
        if (appProxy.state.videos.length > 1) {
          if (
            !appProxy.state.commonConfigForBatchCompression.audioChannelConfig
          ) {
            appProxy.state.commonConfigForBatchCompression.audioChannelConfig =
              {
                channelLayout: 'mono',
              }
          }
          if (
            !appProxy.state.commonConfigForBatchCompression.audioChannelConfig
              .monoSource
          ) {
            appProxy.state.commonConfigForBatchCompression.audioChannelConfig.monoSource =
              {
                left: true,
                right: true,
              }
          }
          appProxy.state.commonConfigForBatchCompression.audioChannelConfig
            .monoSource!.right = isSelected
          normalizeBatchVideosConfig()
        }
      }
    },
    [videoIndex],
  )

  const handleStereoSwapChange = useCallback(() => {
    const currentConfig =
      videoIndex >= 0 && appProxy.state.videos[videoIndex]?.config
        ? appProxy.state.videos[videoIndex].config.audioChannelConfig
        : appProxy.state.commonConfigForBatchCompression.audioChannelConfig

    const newValue = !currentConfig?.stereoSwapChannels

    if (videoIndex >= 0 && appProxy.state.videos[videoIndex]?.config) {
      const videoConfig = appProxy.state.videos[videoIndex].config
      if (!videoConfig.audioChannelConfig) {
        videoConfig.audioChannelConfig = {
          channelLayout: 'stereo',
        }
      }
      videoConfig.audioChannelConfig.stereoSwapChannels = newValue
      appProxy.state.videos[videoIndex].isConfigDirty = true
    } else {
      if (appProxy.state.videos.length > 1) {
        if (
          !appProxy.state.commonConfigForBatchCompression.audioChannelConfig
        ) {
          appProxy.state.commonConfigForBatchCompression.audioChannelConfig = {
            channelLayout: 'stereo',
          }
        }
        appProxy.state.commonConfigForBatchCompression.audioChannelConfig.stereoSwapChannels =
          newValue
        normalizeBatchVideosConfig()
      }
    }
  }, [videoIndex])

  const shouldDisableInput =
    videos.length === 0 ||
    isCompressing ||
    isProcessCompleted ||
    isLoadingFiles ||
    audioVolume === 0

  const hasNoAudio = videoInfoRaw?.audioStreams?.length === 0

  return (
    <div>
      <Select
        fullWidth
        label="Channel:"
        className="block flex-shrink-0 rounded-2xl"
        size="sm"
        value={audioChannelConfig?.channelLayout ?? 'original'}
        selectedKeys={[audioChannelConfig?.channelLayout ?? 'original']}
        onChange={(evt) => {
          const value = evt?.target?.value
          if (value) {
            handleChannelLayoutChange(value)
          }
        }}
        selectionMode="single"
        isDisabled={shouldDisableInput || hasNoAudio}
        classNames={{
          label: '!text-gray-600 dark:!text-gray-400 text-sm',
        }}
      >
        <SelectItem key="original" textValue="Original">
          Original
        </SelectItem>
        <SelectItem key="mono" textValue="Mono">
          Mono
        </SelectItem>
        <SelectItem key="stereo" textValue="Stereo">
          Stereo
        </SelectItem>
      </Select>
      <AnimatePresence mode="wait">
        {audioChannelConfig?.channelLayout === 'mono' ? (
          <motion.div {...slideDownTransition} className="mt-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Mono Source:
            </p>
            <div className="flex gap-4">
              <Checkbox
                isSelected={audioChannelConfig?.monoSource?.left ?? true}
                onValueChange={handleMonoLeftChange}
                isDisabled={shouldDisableInput}
              >
                <span className="text-sm">Left</span>
              </Checkbox>
              <Divider orientation="vertical" className="h-5" />
              <Checkbox
                isSelected={audioChannelConfig?.monoSource?.right ?? true}
                onValueChange={handleMonoRightChange}
                isDisabled={shouldDisableInput}
              >
                <span className="text-sm">Right</span>
              </Checkbox>
            </div>
          </motion.div>
        ) : null}
        {audioChannelConfig?.channelLayout === 'stereo' ? (
          <motion.div {...slideDownTransition} className="mt-4">
            <Switch
              isSelected={audioChannelConfig?.stereoSwapChannels ?? false}
              onValueChange={handleStereoSwapChange}
              isDisabled={shouldDisableInput}
            >
              <p className="text-gray-600 dark:text-gray-400 text-sm mr-2 w-full">
                Swap left and right channels
              </p>
            </Switch>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default AudioChannels
