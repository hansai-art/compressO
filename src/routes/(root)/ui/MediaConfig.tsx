import { AnimatePresence } from 'framer-motion'
import React from 'react'
import { useSnapshot } from 'valtio'

import Layout from '@/components/Layout'
import { cn } from '@/utils/tailwind'
import CompressionProgress from './CompressionProgress'
import CustomizeMediaOnBatchActions from './CustomizeMediaOnBatchActions'
// import OutputSettings from './output-settings/-index'
import { appProxy } from '../-state'
import PreviewBatchVideos from './PreviewBatchMedia'
import PreviewSingleVideo from './PreviewSingleMedia'
import styles from './styles.module.css'

function MediaConfig() {
  const {
    state: { media, isCompressing, selectedMediaIndexForCustomization },
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
            {media.length > 1 ? (
              <>
                <PreviewBatchVideos />
                {selectedMediaIndexForCustomization > -1 ? (
                  <CustomizeMediaOnBatchActions />
                ) : null}
              </>
            ) : (
              <PreviewSingleVideo mediaIndex={0} />
            )}
          </AnimatePresence>
        </section>
        {/* <section className="p-4 w-full h-full rounded-xl border-2 border-zinc-200 dark:border-zinc-800">
          <OutputSettings
            mediaIndex={
              media.length === 1 ? 0 : selectedMediaIndexForCustomization
            }
          />
        </section> */}
      </div>
      {isCompressing ? <CompressionProgress /> : null}
    </Layout>
  )
}

export default React.memo(MediaConfig)
