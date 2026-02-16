import { SelectItem } from '@heroui/react'
import { useCallback } from 'react'
import { useSnapshot } from 'valtio'

import Select from '@/components/Select'
import { appProxy, normalizeBatchVideosConfig } from '../../-state'

const AUDIO_BITRATES = [
  { value: 64, label: '64 kbps' },
  { value: 96, label: '96 kbps' },
  { value: 128, label: '128 kbps' },
  { value: 160, label: '160 kbps' },
  { value: 192, label: '192 kbps' },
  { value: 256, label: '256 kbps' },
  { value: 320, label: '320 kbps' },
]

type AudioBitrateProps = {
  videoIndex: number
}

function AudioBitrate({ videoIndex }: AudioBitrateProps) {
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
  const { audioConfig } = config ?? commonConfigForBatchCompression ?? {}

  const handleBitrateChange = useCallback(
    (value: string) => {
      const bitrate = value === 'original' ? null : Number.parseInt(value, 10)

      if (videoIndex >= 0 && appProxy.state.videos[videoIndex]?.config) {
        const videoConfig = appProxy.state.videos[videoIndex].config
        if (!videoConfig.audioConfig) {
          videoConfig.audioConfig = { volume: 100 }
        }
        videoConfig.audioConfig.bitrate = bitrate
        appProxy.state.videos[videoIndex].isConfigDirty = true
      } else {
        if (appProxy.state.videos.length > 1) {
          if (!appProxy.state.commonConfigForBatchCompression.audioConfig) {
            appProxy.state.commonConfigForBatchCompression.audioConfig = {
              volume: 100,
            }
          }
          appProxy.state.commonConfigForBatchCompression.audioConfig.bitrate =
            bitrate
          normalizeBatchVideosConfig()
        }
      }
    },
    [videoIndex],
  )

  const shouldDisableInput =
    videos.length === 0 ||
    isCompressing ||
    isProcessCompleted ||
    isLoadingFiles ||
    audioConfig?.volume === 0

  const hasNoAudio = videoInfoRaw?.audioStreams?.length === 0
  const currentValue = audioConfig?.bitrate ?? 'original'

  return (
    <Select
      fullWidth
      label="Bitrate:"
      className="block flex-shrink-0 rounded-2xl"
      size="sm"
      value={currentValue?.toString() ?? 'original'}
      selectedKeys={[currentValue?.toString() ?? 'original']}
      onChange={(evt) => {
        const value = evt?.target?.value
        if (value) {
          handleBitrateChange(value)
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
      {
        AUDIO_BITRATES.map((bitrate) => (
          <SelectItem key={bitrate.value} textValue={bitrate.label}>
            {bitrate.label}
          </SelectItem>
        )) as any
      }
    </Select>
  )
}

export default AudioBitrate
