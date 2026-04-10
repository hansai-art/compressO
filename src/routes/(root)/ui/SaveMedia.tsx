import { open, save } from '@tauri-apps/plugin-dialog'
import React, { useCallback } from 'react'
import { snapshot, useSnapshot } from 'valtio'

import Button from '@/components/Button'
import Icon from '@/components/Icon'
import { toast } from '@/components/Toast'
import Tooltip from '@/components/Tooltip'
import {
  copyFileToClipboard,
  moveFile,
  showItemInFileManager,
} from '@/tauri/commands/fs'
import { appProxy } from '../-state'

function SaveMedia() {
  const {
    state: { media, isSaving, isSaved, isCompressing },
  } = useSnapshot(appProxy)
  const mediaFile = media.length === 1 ? media[0] : null

  const handleCompressedMediaSave = useCallback(async () => {
    if (appProxy.state.media.length) {
      const { media } = appProxy.state
      const isBatch = media.length > 1
      const mediaFile = media.length > 0 ? media[0] : null
      const { compressedFile, fileName } = mediaFile ?? {}

      try {
        let pathToSave: string | string[] | null = null

        if (isBatch) {
          const selectedDirectory = await open({
            directory: true,
            title: '選擇要儲存壓縮結果的資料夾',
          })
          if (selectedDirectory) {
            pathToSave = selectedDirectory as string
          }
        } else {
          pathToSave = await save({
            title: '選擇要儲存壓縮結果的位置',
            defaultPath: `compressO-${compressedFile?.fileNameToDisplay ?? fileName ?? ''}`,
          })
        }

        if (pathToSave) {
          appProxy.state.isSaving = true
          appProxy.state.isSaved = false
          appProxy.state.savedPath = pathToSave

          if (isBatch) {
            const directory = pathToSave as string

            for (let i = 0; i < media.length; i++) {
              const mediaFile = media[i]
              if (mediaFile.compressedFile?.pathRaw) {
                appProxy.state.media[i].compressedFile = {
                  ...(snapshot(appProxy).state.media[i].compressedFile ?? {}),
                  isSaving: true,
                  isSaved: false,
                }

                const destinationPath = `${directory}/compressO-${mediaFile?.compressedFile?.fileNameToDisplay || mediaFile?.fileName}`

                await moveFile(
                  mediaFile.compressedFile.pathRaw,
                  destinationPath,
                )
                appProxy.state.media[i].compressedFile = {
                  ...(snapshot(appProxy).state.media[i].compressedFile ?? {}),
                  savedPath: destinationPath,
                  isSaving: false,
                  isSaved: true,
                }
              }
            }
            appProxy.state.isSaved = true
          } else {
            appProxy.state.media[0].compressedFile = {
              ...(snapshot(appProxy).state.media[0].compressedFile ?? {}),
              isSaving: true,
              isSaved: false,
            }
            await moveFile(
              compressedFile?.pathRaw as string,
              pathToSave as string,
            )
            appProxy.state.media[0].compressedFile = {
              ...(snapshot(appProxy).state.media[0].compressedFile ?? {}),
              savedPath: pathToSave as string,
              isSaving: false,
              isSaved: true,
            }
            appProxy.state.isSaved = true
          }
        }
      } catch (_) {
        toast.error('無法儲存到指定路徑。')
        for (let i = 0; i < media.length; i++) {
          appProxy.state.media[i].compressedFile = {
            ...(snapshot(appProxy).state.media[i].compressedFile ?? {}),
            isSaving: false,
            isSaved: false,
          }
        }
      }
      appProxy.state.isSaving = false
    }
  }, [])

  const openInFileManager = async () => {
    const { media } = appProxy.state
    const mediaFile = media.length > 0 ? media[0] : null
    const { compressedFile } = mediaFile ?? {}

    const savedPath = appProxy.state.savedPath ?? compressedFile?.savedPath
    if (!savedPath) return
    try {
      await showItemInFileManager(savedPath)
    } catch {}
  }

  const copyToClipboard = async () => {
    const { media } = appProxy.state
    const mediaFile = media.length > 0 ? media[0] : null
    const { compressedFile } = mediaFile ?? {}

    const savedPath =
      appProxy.state.savedPath ??
      compressedFile?.savedPath ??
      compressedFile?.pathRaw
    if (!savedPath) return

    try {
      await copyFileToClipboard(savedPath)
      toast.success('已複製到剪貼簿。')
    } catch {}
  }

  return (
    <div className="flex items-center">
      <Button
        className="flex justify-center items-center"
        color="success"
        onPress={handleCompressedMediaSave}
        isLoading={isSaving}
        isDisabled={isSaving || isSaved}
        fullWidth
      >
        {isSaving ? '儲存中…' : isSaved ? '已儲存' : '儲存檔案'}
        {!isSaving ? (
          <Icon
            name={isSaved ? 'tick' : 'download'}
            className="text-green-300"
          />
        ) : null}
      </Button>
      {isSaved ? (
        <>
          <Tooltip content="在檔案總管中顯示" aria-label="在檔案總管中顯示">
            <Button
              isIconOnly
              className="ml-2 text-green-500"
              onPress={openInFileManager}
            >
              <Icon name="fileExplorer" />
            </Button>
          </Tooltip>
        </>
      ) : null}
      {!isCompressing &&
      mediaFile?.isProcessCompleted &&
      mediaFile?.compressedFile?.isSuccessful ? (
        <Tooltip
          content="將輸出檔複製到剪貼簿"
          aria-label="將輸出檔複製到剪貼簿"
        >
          <Button
            isIconOnly
            className="ml-2 text-green-500"
            onPress={copyToClipboard}
          >
            <Icon name="copy" size={28} />
          </Button>
        </Tooltip>
      ) : null}
    </div>
  )
}

export default React.memo(SaveMedia)
