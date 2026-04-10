import Markdown from '@/components/Markdown'
import ScrollShadow from '@/components/ScrollShadow'
import Title from '@/components/Title'

const BEGINNER_GUIDE = `
## 快速開始

1. 在首頁拖曳檔案進來，或點一下中間區塊選擇圖片／影片。
2. 選好檔案後，在右側調整輸出設定。
3. 按下「開始處理」開始壓縮。
4. 完成後按「儲存檔案」把結果存到電腦。

## 新手最推薦的操作方式

### 壓影片

- 先保留預設的壓縮預設。
- 想快速縮小檔案時，直接調整畫質滑桿即可。
- 需要更小檔案時，可再降低解析度或 FPS。

### 壓圖片

- 一般照片可先從畫質開始調整。
- 如果要分享社群或傳訊息，通常縮小尺寸也很有幫助。
- 若是 SVG，要輸出成 PNG / JPG / WebP 時可再調整縮放倍率。

## 批次處理

- 一次加入多個檔案後，可先用「批次設定」套用共用設定。
- 若其中某個檔案要單獨調整，再進入該檔案的個別設定。

## 常見情境

- **想保留品質**：先開啟無損壓縮，或只小幅降低畫質。
- **想更省空間**：降低畫質、解析度、FPS，並改成較高壓縮格式。
- **沒有聲音需求**：把音量調成 0，可進一步減少檔案大小。

## 儲存與分享

- 單一檔案可直接選擇儲存位置。
- 批次處理會先選資料夾，再把所有結果存進去。
- 壓縮完成後，也可以用旁邊按鈕在檔案總管開啟或複製到剪貼簿。

## 小提醒

- 原始檔不會上傳到雲端，所有處理都在本機完成。
- 若結果不理想，可以按右上角重新設定後再試一次。
`

function Tutorial() {
  return (
    <section className="w-full py-10 pb-4 px-8">
      <section className="mb-6">
        <Title title="新手操作教學" iconProps={{ name: 'info' }} />
      </section>
      <ScrollShadow className="max-h-[60vh] pr-2">
        <Markdown content={BEGINNER_GUIDE} className="text-sm" />
      </ScrollShadow>
    </section>
  )
}

export default Tutorial
