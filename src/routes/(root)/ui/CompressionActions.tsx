import { useDisclosure } from '@heroui/modal'
import { UseDisclosureProps } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useState } from 'react'
import { snapshot, useSnapshot } from 'valtio'

import Button from '@/components/Button'
import Icon from '@/components/Icon'
import { deleteFile } from '@/tauri/commands/fs'
import AlertDialog, { AlertDialogButton } from '@/ui/Dialogs/AlertDialog'
import { appProxy } from '../-state'

function CompressionActions() {
  const {
    state: { videos, isProcessCompleted, isLoadingFiles, isSaving },
    resetProxy,
  } = useSnapshot(appProxy)

  const [isCloseHovered, setIsCloseHovered] = useState(false)
  const [isRedoHovered, setIsRedoHovered] = useState(false)

  const alertDiscloser = useDisclosure()

  const handleDiscard = async ({
    closeModal,
  }: {
    closeModal: UseDisclosureProps['onClose']
  }) => {
    try {
      const deletePromises = videos
        .flatMap((video) => [
          video.compressedVideo?.pathRaw
            ? deleteFile(video.compressedVideo.pathRaw)
            : null,
          video.thumbnailPathRaw ? deleteFile(video.thumbnailPathRaw) : null,
        ])
        .filter(Boolean)

      await Promise.allSettled(deletePromises)
      closeModal?.()
      resetProxy()
    } catch {}
  }

  const handleCancelCompression = () => {
    const appSnapshot = snapshot(appProxy)
    if (appSnapshot.state.isProcessCompleted && !appSnapshot.state.isSaved) {
      alertDiscloser.onOpen()
    } else {
      resetProxy()
    }
  }

  const handleReconfigure = () => {
    appProxy.timeTravel('beforeCompressionStarted')
  }

  return videos.length && !isLoadingFiles ? (
    <>
      <div className="mx-auto w-fit flex justify-center items-center gap-2 z-[10]">
        {isProcessCompleted ? (
          <AnimatePresence mode="wait">
            <Button
              size="sm"
              onPress={handleReconfigure}
              variant="light"
              radius="full"
              className="gap-1 w-fit min-w-0"
              onMouseEnter={() => setIsRedoHovered(true)}
              onMouseLeave={() => setIsRedoHovered(false)}
              isIconOnly={!isRedoHovered}
              isDisabled={isSaving}
            >
              <Icon name="redo" size={22} />{' '}
              <motion.span
                initial={{ maxWidth: 0, opacity: 0 }}
                animate={{
                  maxWidth: isRedoHovered ? 80 : 0,
                  opacity: isRedoHovered ? 1 : 0,
                }}
                exit={{ maxWidth: 0, opacity: 0 }}
                className="overflow-hidden whitespace-nowrap"
                transition={{ duration: 0.5 }}
              >
                Redo
              </motion.span>
            </Button>
          </AnimatePresence>
        ) : null}
        <AnimatePresence mode="wait">
          <Button
            size="sm"
            onPress={handleCancelCompression}
            variant={'light'}
            radius="full"
            className="gap-1 w-fit min-w-0"
            onMouseEnter={() => setIsCloseHovered(true)}
            onMouseLeave={() => setIsCloseHovered(false)}
            isDisabled={isSaving}
          >
            <Icon name="cross" size={22} />
            <motion.span
              initial={{ maxWidth: 0, opacity: 0 }}
              animate={{
                maxWidth: isCloseHovered ? 80 : 0,
                opacity: isCloseHovered ? 1 : 0,
              }}
              exit={{ maxWidth: 0, opacity: 0 }}
              className="overflow-hidden whitespace-nowrap"
              transition={{ duration: 0.4 }}
            >
              Close
            </motion.span>
          </Button>
        </AnimatePresence>
      </div>
      <AlertDialog
        title={`Video${videos.length > 1 ? 's' : ''} not saved`}
        discloser={alertDiscloser}
        description={`Your compressed video${videos.length > 1 ? 's are' : ' is'} not yet saved. Are you sure you want to discard it?`}
        renderFooter={({ closeModal }) => (
          <>
            <AlertDialogButton onPress={closeModal}>Go Back</AlertDialogButton>
            <AlertDialogButton
              color="danger"
              onPress={() => handleDiscard({ closeModal })}
            >
              Yes
            </AlertDialogButton>
          </>
        )}
      />
    </>
  ) : null
}

export default React.memo(CompressionActions)
