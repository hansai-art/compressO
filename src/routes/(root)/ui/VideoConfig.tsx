import { AnimatePresence } from 'framer-motion'
import React from 'react'
import { useSnapshot } from 'valtio'

import Layout from '@/components/Layout'
import { cn } from '@/utils/tailwind'
import CompressionProgress from './CompressionProgress'
import CustomizeVideoOnBatchActions from './CustomizeVideoOnBatchActions'
import OutputSettings from './output-settings/-index'
import PreviewBatchVideos from './PreviewBatchVideos'
import PreviewSingleVideo from './PreviewSingleVideo'
import styles from './styles.module.css'
import { appProxy } from '../-state'

function VideoConfig() {
  const {
    state: { videos, isCompressing, selectedVideoIndexForCustomization },
  } = useSnapshot(appProxy)

  return (
    <Layout
      childrenProps={{
        className: 'h-full',
      }}
      hideLogo
    >
      <div className={cn(['h-full p-6', styles.videoConfigContainer])}>
        <section
          className={cn(
            'relative w-full h-full px-4 py-6 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 overflow-hidden',
          )}
        >
          <AnimatePresence>
            {videos.length > 1 ? (
              <>
                <PreviewBatchVideos />
                {selectedVideoIndexForCustomization > -1 ? (
                  <CustomizeVideoOnBatchActions />
                ) : null}
              </>
            ) : (
              <PreviewSingleVideo videoIndex={0} />
            )}
          </AnimatePresence>
        </section>
        <section className="p-4 w-full h-full rounded-xl border-2 border-zinc-200 dark:border-zinc-800">
          <OutputSettings
            videoIndex={
              videos.length === 1 ? 0 : selectedVideoIndexForCustomization
            }
          />
        </section>
      </div>
      {isCompressing ? <CompressionProgress /> : null}
    </Layout>
  )
}

export default React.memo(VideoConfig)
