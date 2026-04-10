import React from 'react'

import Link from '@/components/Link'
import Markdown from '@/components/Markdown'
import ScrollShadow from '@/components/ScrollShadow'
import Select, { SelectItem } from '@/components/Select'
import Title from '@/components/Title'
import { tutorialDocs } from '@/constants/tutorialDocs'

function Tutorial() {
  const [selectedDocId, setSelectedDocId] = React.useState(tutorialDocs[0].id)

  const selectedDoc =
    tutorialDocs.find((doc) => doc.id === selectedDocId) ?? tutorialDocs[0]

  return (
    <section className="w-full py-10 pb-4 px-8">
      <section className="mb-4">
        <Title title="新手操作教學" iconProps={{ name: 'info' }} />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          以下內容整理自 Happy 官方文件，並翻譯成台灣常用繁體中文。
        </p>
      </section>

      <Select
        fullWidth
        label="教學頁面"
        selectedKeys={[selectedDoc.id]}
        value={selectedDoc.id}
        onChange={(evt) => {
          setSelectedDocId(evt.target.value)
        }}
        className="mb-2"
        classNames={{
          label: '!text-gray-600 dark:!text-gray-400 text-sm',
        }}
      >
        {tutorialDocs.map((doc) => (
          <SelectItem key={doc.id}>{doc.title}</SelectItem>
        ))}
      </Select>

      <div className="mb-4 flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span>共 {tutorialDocs.length} 篇官方教學／說明</span>
        <Link href={selectedDoc.sourceUrl} isExternal showAnchorIcon size="sm">
          查看官方原文
        </Link>
      </div>

      <ScrollShadow className="max-h-[56vh] pr-2">
        <Markdown content={selectedDoc.content} className="text-sm" />
      </ScrollShadow>
    </section>
  )
}

export default Tutorial
