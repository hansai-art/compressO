export interface TutorialDoc {
  id: string
  title: string
  sourceUrl: string
  content: string
}

export const tutorialDocs: TutorialDoc[] = [
  {
    id: 'welcome',
    title: '歡迎',
    sourceUrl: 'https://happy.engineering/docs/',
    content: `
## 歡迎

**Happy** 讓你可以從任何地方控制 **AI 程式代理**，不管是手機、平板，
還是瀏覽器都可以使用。它和一般付費雲端服務最大的不同是：
Happy 讓這些代理實際跑在**你自己的電腦**上。

- 可以是桌機、筆電、伺服器，甚至樹莓派
- 只要該機器連得上網路，就能遠端控制
- 出門時也能把工作交給 Claude Code，回來直接看成果

### Happy Coder 的優點

- **幾乎不打亂既有流程**：Claude Code 仍舊跑在你自己的電腦上，不用放棄現有工具、硬體或工作環境。
- **隨時隨地可用**：先在桌機上開始，之後改用手機繼續也沒問題。
- **多工作階段**：可以同時跑多個 Claude Code 工作階段，前端、後端各自處理。
- **端對端加密**：你的程式碼留在自己的裝置上，裝置之間的訊息會加密傳輸。
- **沒有雲端使用費**：因為你用的是自己的機器，所以沒有額外雲端訂閱成本。

## 為什麼用 Happy Coder？

和把程式碼丟到雲端機器上跑的服務不同，Happy Coder 直接使用你已經擁有的電腦。
這代表你可以：

- 使用任何你想要的硬體
- 保留原本熟悉的開發環境
- 處理私有或高敏感度系統
- 不受月費或用量限制
- 完整掌控自己的工作環境

不管你是在做個人專案、需要特殊硬體，還是只想在離開座位時查看長時間執行中的任務，
Happy Coder 都能讓你照自己的方式工作。

## 開始使用

- **快速開始**：建立第一個手機工作流程
- **管理工作階段**：啟動、停止與切換多個 Claude Code 工作階段
- **語音操作**：在移動中用語音進行無手操作
- **啟用推播通知**：當 Claude Code 需要你回覆或任務完成時收到通知

## 資源

- **範例**：看看 Happy Coder 可以如何融入你的開發生活
- **社群**：官方開源社群在 GitHub：<https://github.com/slopus/happy>
`,
  },
  {
    id: 'quick-start',
    title: '快速開始',
    sourceUrl: 'https://happy.engineering/docs/quick-start/',
    content: `
## 快速開始指南

這份快速開始指南會幫你把 Claude Code 放進口袋裡。

## 安裝方式

### 1. 下載行動 App

- **iPhone / iPad**：App Store
- **Android**：Google Play
- **網頁版**：<https://app.happy.engineering>

### 2. 在電腦上安裝 Happy Coder

\`\`\`bash
npm install -g happy-coder
\`\`\`

Happy 需要 **Node.js 18 以上**，因為它使用了以下能力：

- Top-level await
- 更完整的 ES module 支援
- 穩定版 fetch API
- 部分相依套件本身就要求 Node.js 18+

### 3. 用手機掃描 QR Code

\`\`\`bash
happy --auth
\`\`\`

這個指令會顯示 QR Code，讓你的手機 App 和電腦配對。

## 第一次使用

當手機成功連上電腦後：

1. 建立新的對話
2. 直接開始和 Claude 一起寫程式
`,
  },
  {
    id: 'managing-sessions',
    title: '管理工作階段',
    sourceUrl: 'https://happy.engineering/docs/features/parallel-tasks/',
    content: `
## 管理工作階段

這一頁官方目前只有一句話：

> Karl is still working on this.

翻成台灣中文就是：

> 這一頁官方還在撰寫中。

不過從首頁介紹可以知道，Happy Coder 的重點之一是支援**多工作階段**：

- 可同時開多個 Claude Code 實例
- 可以把前端、後端或不同任務拆開處理
- 能在手機上快速切換不同工作內容
- 每個工作階段都保有自己的上下文
`,
  },
  {
    id: 'voice-coding',
    title: '語音操作',
    sourceUrl:
      'https://happy.engineering/docs/features/voice-coding-with-claude-code/',
    content: `
## 為什麼語音寫程式有意義（即使它看起來很蠢）

官方這篇文章想表達的是：**語音並不是要取代你的桌面工作流，
而是把原本「不會拿來寫程式」的零碎時間變得有價值。**

像是：

- 晚上已經坐在電腦前工作八小時，不想再回桌前
- 手很痠，但腦袋還能思考
- 通勤、散步、躺著休息時，還是想整理想法

## 高風險想法常常死在「沒時間研究」

很多工程師都會有一些很想做、但風險很高的點子，例如：

- 把既有工作流程改成新的架構
- 重寫認證系統
- 換掉核心背景任務系統

這些想法如果沒有額外探索時間，往往永遠不會開始。
Happy Coder 的語音模式，就是讓你在離開桌面之後，還能先把這些想法整理起來。

## Happy Coder 的語音代理是翻譯器，不是取代你思考的夥伴

官方的說法很直接：

\`\`\`
你說話 -> 手機上的語音代理 -> 電腦上的 Claude Code -> 你的程式碼
\`\`\`

語音代理不會替你發明點子，它的任務是把你口語、跳躍、反覆修正的描述，
整理成 Claude Code 比較容易理解的請求。

而且在 Happy Coder 裡，語音代理提示詞可以自行調整，不需要 fork App 重編。

## 語音雖然比較差，但總比完全沒做更好

官方強調幾個重點：

- 它**不會**取代你的桌面環境
- 它**不會**比打字更有效率
- 它也不是什麼魔法 AI 配對工程師

但它能做到的是：

- 把晚餐後到睡前這段原本不會寫程式的時間利用起來
- 讓雙手休息一下
- 幫你先做低門檻探索，等你真的有興趣時再回桌面繼續

## 實際工作方式

官方作者舉的例子包括：

- 在開車時把想法講給 Claude，請它整理成 Linear issue
- 躺在吊床上時，先讓 Claude 幫忙把新架構的雛形 stub 出來
- 等到真的有感覺了，再回到電腦前直接接續同一個工作階段

這之所以可行，是因為 Happy Coder 支援**即時雙向同步**：
你在手機上開始的工作，可以無縫接到桌面繼續做。

## 語音模式的重點整理

- 透過手機使用
- 連到你電腦上的 Claude Code
- 把你的口語整理成結構化請求
- 與桌面工作階段即時同步

簡單說：它不是為了讓語音比鍵盤更強，而是讓你在**不方便坐回桌前的時候，
仍然能往前推進工作。**
`,
  },
  {
    id: 'push-notifications',
    title: '推播通知',
    sourceUrl: 'https://happy.engineering/docs/guides/push-notifications/',
    content: `
## 啟用推播通知

你可以直接用 Happy CLI 測試推播通知是否正常運作：

\`\`\`bash
happy notify -p "message of push notification" -t "Title of Notification"
\`\`\`

指令中的參數意思：

- \`-p\`：推播訊息內容
- \`-t\`：推播標題

如果手機端已經正確啟用通知，送出後就應該能收到測試推播。
`,
  },
  {
    id: 'example',
    title: '範例：Hemingway 技巧',
    sourceUrl: 'https://happy.engineering/docs/use-cases/hemingway-technique/',
    content: `
## Hemingway 技巧

這篇是官方的實際使用範例。

海明威寫作時有一個技巧：**不要把事情做完才停，而是停在你知道下一步該做什麼的地方。**
這樣隔天回來時，比較容易立刻接續。

官方作者把這個概念套到程式開發上，但他發現以前要做到這件事很難：

- 晚上已經很累了
- 還要花 10 到 20 分鐘設定一個「明天早上可以接著做」的任務
- 成本太高，就不會養成習慣

有了 Claude Code 與 Happy Coder 之後，流程變成：

1. 睡前躺著時，用手機和 Claude 討論一個小任務
2. 先用 planning mode 把做法想清楚
3. 確認方案後，讓 Claude 直接開始做
4. 早上醒來就能看到通知，例如「4 個檔案待審查，新增 237 行程式碼」

## 這個習慣有什麼價值？

- 原本需要 20 分鐘進入狀況，變成 5 分鐘的對話
- 比起睡前滑社群，現在可以把零碎時間拿來準備隔天的工作
- 因為任務變得很小，更容易養成固定流程

## 核心重點

Happy Coder 最有價值的地方，不只是「能在手機上和 Claude Code 對話」，
而是它把很多原本不會被利用的時間，變成能為明天鋪路的時段。
`,
  },
  {
    id: 'faq',
    title: '常見問題',
    sourceUrl: 'https://happy.engineering/docs/faq/',
    content: `
## 一般常見問題

### Happy Coder 是做什麼的？

Happy Coder 是一款手機 App，讓你可以從手機控制多台電腦上的程式代理。

### Happy Coder 免費嗎？

是，完全免費。

- **沒有使用次數限制**
- **沒有裝置數量限制**
- **MIT 開源**

### 會被綁住嗎？

不會。

- 原始碼完整開源
- 可以自己架 relay server
- 不需要帳號
- 可搭配原生 Claude Code 使用，不是封閉包裝版本

### 為什麼官方說它很簡單？

因為它把手機操作 Claude Code 的摩擦降到很低：

1. **不用註冊**
2. **跨平台**
3. **網路中斷時能優雅處理**
4. **遇到常見錯誤時會直接提示原因**
5. **只專注做好一件事：把 Claude Code 帶到手機上**

### Claude Code 有 App 嗎？

有，官方主推的手機體驗就是 **Happy Coder**。

基本流程：

1. 在手機下載 Happy Coder
2. 在電腦安裝 \`happy-coder\`
3. 執行 \`happy\`
4. 用手機掃 QR Code 連線

### 可以在手機上寫程式嗎？

可以，但官方很誠實地說，手機比較適合：

- 規劃功能
- 腦力激盪
- 用語音和 Claude 討論
- 睡前先把任務設定好
- 收推播、查看任務是否完成

桌面則比較適合：

- 仔細審查程式碼
- 精準修改
- 執行測試與除錯

### 如果連線中斷怎麼辦？

Happy Coder 會：

- 先把訊息排隊
- 讓電腦上的 Claude Code 繼續工作
- 等網路恢復後自動重連
- 避免丟失訊息或壞掉的工作階段

### 它看得到我的程式碼嗎？

官方說不行，因為資料採**端對端加密**：

- 加密在你的裝置端完成
- Relay server 只看到加密後的資料
- 只有持有金鑰的裝置才能解密

### 常見排錯

#### 找不到 Claude Code

\`\`\`bash
npm install -g claude-code
claude-code --version
happy
\`\`\`

#### QR Code 掃不到

1. 調高手機亮度
2. 清理鏡頭
3. 改用較大的 QR Code：\`happy --qr-size large\`
4. 或改用手動輸入代碼：\`happy --no-qr\`

#### 連接埠被占用

\`\`\`bash
lsof -i :8765
kill -9 [PID]
happy --port 8766
\`\`\`

#### 無法連到 relay server

- 先試手機行動網路
- 請公司 IT 白名單放行 \`relay.happy.engineering\`
- 或改成自己架 relay server
`,
  },
]
