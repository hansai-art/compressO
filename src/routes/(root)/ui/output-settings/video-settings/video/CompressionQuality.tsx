import { AnimatePresence, motion } from 'framer-motion'
import React, { useCallback } from 'react'
import { snapshot, useSnapshot } from 'valtio'

import Slider from '@/components/Slider/Slider'
import Switch from '@/components/Switch'
import { slideDownTransition } from '@/utils/animation'
import { appProxy, normalizeBatchVideosConfig } from '../../../../-state'

type CompressionQualityProps = {
  mediaIndex: number
}

function CompressionQuality({ mediaIndex }: CompressionQualityProps) {
  const {
    state: {
      isCompressing,
      isProcessCompleted,
      media,
      commonConfigForBatchCompression,
      isLoadingMediaFiles,
    },
  } = useSnapshot(appProxy)
  const video =
    media.length > 0 && mediaIndex >= 0 && media[mediaIndex].type == 'video'
      ? media[mediaIndex]
      : null
  const { config } = video ?? {}
  const { quality: compressionQuality, shouldEnableQuality } =
    config ?? commonConfigForBatchCompression ?? {}

  const [quality, setQuality] = React.useState<number>(
    compressionQuality ?? 100,
  )
  const debounceRef = React.useRef<NodeJS.Timeout>()
  const qualityRef = React.useRef<number>(quality)

  React.useEffect(() => {
    qualityRef.current = quality
  }, [quality])

  React.useEffect(() => {
    const appSnapshot = snapshot(appProxy)
    // TODO: Right now this quality applies for both video and image item within media. figure out what to do for this
    if (
      appSnapshot.state.media.length &&
      quality !==
        (mediaIndex >= 0
          ? appSnapshot.state.media[mediaIndex]?.config?.quality
          : appSnapshot.state.media.length > 1
            ? appSnapshot.state.commonConfigForBatchCompression?.quality
            : undefined)
    ) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        if (mediaIndex >= 0 && appProxy.state.media[mediaIndex]?.config) {
          appProxy.state.media[mediaIndex].config.quality = quality
          appProxy.state.media[mediaIndex].isConfigDirty = true
        } else {
          if (appProxy.state.media.length > 1) {
            appProxy.state.commonConfigForBatchCompression.quality = quality
            normalizeBatchVideosConfig()
          }
        }
      }, 500)
    }
    return () => {
      clearTimeout(debounceRef.current)
    }
  }, [quality, mediaIndex])

  React.useEffect(() => {
    if (compressionQuality !== qualityRef.current) {
      if (
        typeof compressionQuality === 'number' &&
        !Number.isNaN(+compressionQuality)
      )
        setQuality(compressionQuality)
    }
  }, [compressionQuality])

  const handleQualityChange = React.useCallback((value: number | number[]) => {
    if (typeof value === 'number') {
      setQuality(value)
    }
  }, [])

  const handleSwitchToggle = useCallback(() => {
    if (
      mediaIndex >= 0 &&
      appProxy.state.media[mediaIndex].type === 'video' &&
      appProxy.state.media[mediaIndex]?.config
    ) {
      appProxy.state.media[mediaIndex].config.shouldEnableQuality =
        !shouldEnableQuality
      appProxy.state.media[mediaIndex].isConfigDirty = true
    } else {
      // TODO: adjust this for all media types
      if (appProxy.state.media.length > 1) {
        appProxy.state.commonConfigForBatchCompression.shouldEnableQuality =
          !shouldEnableQuality
        normalizeBatchVideosConfig()
      }
    }
  }, [mediaIndex, shouldEnableQuality])

  const shouldDisableInput =
    media.length === 0 ||
    isCompressing ||
    isProcessCompleted ||
    isLoadingMediaFiles

  return (
    <>
      <Switch
        isSelected={shouldEnableQuality}
        onValueChange={handleSwitchToggle}
        isDisabled={shouldDisableInput}
      >
        <p className="text-gray-600 dark:text-gray-400 text-sm mr-2 w-full font-bold">
          Quality
        </p>
      </Switch>
      <AnimatePresence mode="wait">
        {shouldEnableQuality ? (
          <motion.div {...slideDownTransition}>
            <Slider
              label
              aria-label="Quality"
              marks={[
                {
                  value: 0,
                  label: 'Low',
                },
                {
                  value: 50,
                  label: 'Medium',
                },
                {
                  value: 99,
                  label: 'High',
                },
              ]}
              className="mb-8 mx-auto"
              classNames={{
                mark: 'text-[11px] mt-2',
                base: 'mt-[-10px]',
              }}
              getValue={(value) => {
                const val = Array.isArray(value) ? value?.[0] : +value
                return val < 50
                  ? 'Low'
                  : val >= 50 && val < 100
                    ? 'Medium'
                    : 'High'
              }}
              renderValue={(props) => (
                <p className="text-primary text-xs font-bold">
                  {props?.children}
                </p>
              )}
              value={quality}
              onChange={handleQualityChange}
              isDisabled={!shouldEnableQuality || shouldDisableInput}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

export default CompressionQuality
