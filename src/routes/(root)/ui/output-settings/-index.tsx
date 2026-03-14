import { AccordionItem } from '@heroui/react'
import { useSnapshot } from 'valtio'

import Accordion from '@/components/Accordion'
import Icon from '@/components/Icon'
import Title from '@/components/Title'
import { appProxy } from '../../-state'
import CompressionActions from '../CompressionActions'
import ImageSettings from './image-settings/-index'
import VideoSettings from './video-settings/-index'

type OutputSettingsProps = {
  mediaIndex: number
}
function OutputSettings({ mediaIndex }: OutputSettingsProps) {
  const {
    state: {
      activeTab,
      media,
      selectedMediaIndexForCustomization,
      isCompressing,
    },
  } = useSnapshot(appProxy)

  return (
    <div>
      <div className="flex items-center justify-between w-full mb-2">
        <p className="text-lg font-bold">
          {media.length === 1 || selectedMediaIndexForCustomization > -1
            ? 'Output'
            : 'Batch'}{' '}
          Settings
        </p>
        {!isCompressing ? <CompressionActions /> : null}
      </div>
      {activeTab === 'videos' ||
      (media.length === 1 && media[0].type === 'video') ? (
        <VideoSettings mediaIndex={mediaIndex} />
      ) : activeTab === 'images' ||
        (media.length === 1 && media[0].type === 'image') ? (
        <ImageSettings />
      ) : (
        <div className="mx-[-6px]">
          <Accordion isCompact keepContentMounted variant="splitted">
            <AccordionItem
              key="1"
              aria-label="Video Settings"
              title={
                <Title title="Video Settings" className="text-md text-left" />
              }
              startContent={<Icon name="video" size={25} />}
              classNames={{
                base: 'bg-transparent border-1 border-zinc-200 dark:border-zinc-900 px-0!',
              }}
            >
              <VideoSettings mediaIndex={mediaIndex} />
            </AccordionItem>
            <AccordionItem
              key="2"
              aria-label="Image Settings"
              title={
                <Title title="Image Settings" className="text-md text-left" />
              }
              startContent={<Icon name="image" size={25} />}
              classNames={{
                base: 'bg-transparent border-1 border-zinc-200 dark:border-zinc-900 px-0!',
              }}
            >
              <ImageSettings />
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  )
}

export default OutputSettings
