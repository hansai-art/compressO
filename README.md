<div align="center">
  <div align="center">
   <img width="100" height="100" src="public/logo.png" alt="Logo" />
  </div>
 <h1 align="center">CompressO</h1>
 <p align="center">
 將任何影片／圖片壓縮到更小的體積。
    </p>
    <i align="center">
 CompressO（🔉 發音近似「Espresso」）是一款免費且開源的影片／圖片壓縮應用程式。
    </i>
    <br />
    <p align="center">
 支援 <strong>Linux</strong>、<strong>Windows</strong> 與 <strong>macOS</strong>。
    </p>
    <br />
 <div>
  <a href="https://github.com/codeforreal1/compressO/releases">
    <img alt="Linux" src="https://img.shields.io/badge/-Linux-yellow?style=flat-square&logo=linux&logoColor=black&color=orange" />
  </a>
  <a href="https://github.com/codeforreal1/compressO/releases">
    <img alt="Windows" src="https://img.shields.io/badge/-Windows-blue?style=flat-square&logo=windows&logoColor=white" />
  </a>
  <a href="https://github.com/codeforreal1/compressO/releases">
    <img alt="macOS" src="https://img.shields.io/badge/-macOS-black?style=flat-square&logo=apple&logoColor=white" />
  </a>
</div>
     <br />

</div>
<div align="center">
    <img src="public/screenshot.png" alt="介面截圖" height="500" style="border-radius: 16px;" />
</div>

### 安裝
可前往 [releases](https://github.com/codeforreal1/compressO/releases) 頁面下載對應平台的安裝檔 📦。

<strong>安裝檔說明：</strong>

- `CompressO_amd64.deb`：適用於 Ubuntu 等 Debian 系 Linux 發行版
- `CompressO_amd64.AppImage`：適用於多數 Linux 發行版的通用封裝
- `CompressO_aarch64.dmg`：適用於 Apple Silicon 晶片的 MacBook
- `CompressO_x64.dmg`：適用於 Intel 晶片的 MacBook
- `CompressO_x64.msi`：適用於 64 位元 Windows

<strong>Homebrew：僅限 macOS！</strong>
```
brew install --cask codeforreal1/tap/compresso
```

> [!NOTE]
> 使用 CompressO 即表示你已知悉此 App 尚未經過 [notarized](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution) 公證。
>
> Notarization 是 Apple 提供的一項「安全性」機制。
> 你必須把二進位檔送交 Apple，由他們決定是否核准。
> 實際上，這件事通常也代表你得每年支付 100 美元，並依照 Apple 要求的方式建置 App／二進位檔。
>
> 這是一款免費且開源的 App，因此每年支付費用並為了迎合 Apple 而進行公證並不可行。
>
> [Homebrew 安裝腳本](https://github.com/codeforreal1/homebrew-tap/blob/main/Casks/compresso.rb) 已設定為
> 自動移除 `com.apple.quarantine` 屬性，因此一般情況下 App 應可直接使用，不會出現
> Apple Gatekeeper 顯示的「CompressO 已損毀，無法開啟。你應該將它移到垃圾桶。」之類警告。

### 技術

此 App 使用 [Tauri](https://tauri.app/) 建立，是一套以 Rust 🦀 為基礎的跨平台桌面應用框架；前端則是使用 [React](https://react.dev) 搭配 [Vite](https://vite.dev/)。壓縮功能完全仰賴 [FFmpeg](https://ffmpeg.org/)、[pngquant](https://pngquant.org/)、[jpegoptim](https://github.com/tjko/jpegoptim)、[gifski](https://gif.ski/) 等第三方工具，並以各平台專用的獨立二進位檔來執行。
此 App 可完全離線運作，不會對外發送或接收任何網路請求（內建應用程式更新功能除外）。

### 建置
請先確認已安裝 [Rust](https://rust-lang.org/) 與 [Node.js](https://nodejs.org/) 工具鏈。

本機開發：
- 啟動 Tauri 伺服器
```
pnpm tauri:dev 
```
- 啟動 Vite 伺服器：
```
pnpm vite:dev
```

正式版建置：
```
pnpm tauri:build
```

### 畫面截圖
<details>
<summary>
  <strong> 
  查看 App 截圖
  </strong>
</summary>
<img src="https://github.com/user-attachments/assets/f89d3c18-20fd-4359-937b-d4f0c2a4a3f8" width="100%" alt="壓縮輸出結果" loading="lazy" />
<img src="https://github.com/user-attachments/assets/49f95db6-5e9e-4abf-bc7f-54dd3f0ae534" width="100%" alt="裁切／分割功能" loading="lazy" />
<img src="https://github.com/user-attachments/assets/b96fcd4b-1d02-4394-9dd7-419cb4568234" width="100%" alt="批次壓縮" loading="lazy" />
<img src="https://github.com/user-attachments/assets/d86dae45-60c9-4d54-b7b2-98674105103a" width="576" alt="影片／音訊設定" loading="lazy" />
<img src="https://github.com/user-attachments/assets/f7877316-ab91-4f08-9b4d-e2bb21cc8d5a" width="576" alt="App 設定" loading="lazy" />
<img src="https://github.com/user-attachments/assets/b7367803-c336-4eca-a8e3-cf53044340df" width="576" alt="嵌入字幕" loading="lazy" />
<img src="https://github.com/user-attachments/assets/23bdeb17-5fb1-4376-84ed-61a0712e7aea" width="576" alt="更新中介資料" loading="lazy" />
<img src="https://github.com/user-attachments/assets/61559ad7-cd2c-46cf-925f-ae189db0599c" width="576" alt="關於頁面" loading="lazy" />
</details>

### 常見問題
<details>
<summary>
  <strong> 
  macOS：「CompressO」已損毀，無法開啟。你應該將它移到垃圾桶。
  </strong>
</summary>
<img src="assets/image.png" width="300" />
<p>
  這個錯誤訊息是 Apple 用來把關 App 開發者的機制之一，除非開發者每年支付 100 美元並完成 Apple 的簽章流程，否則就可能看到這種警告。這段訊息其實相當誤導，因為 App 本身並沒有損毀。由於這是一款免費 App，我不打算為了迎合 Apple 而走上這條路。以下是這個問題的簡單解法，請開啟終端機並執行：
</p>

```
xattr -cr /Applications/CompressO.app
```
<p>
  若你是透過 Homebrew 安裝 App，就不會看到這個錯誤。
</p>
<p>
  如果你不想套用上述解法，也可以直接把 App 移到垃圾桶（這也表示你將無法在 Mac 上使用 CompressO）。
</p>
</details>
<details>
<summary>
  <strong>macOS：「因為無法驗證開發者身分，所以無法開啟『CompressO』。」</strong>
</summary>
<img src="assets/image-1.png" width="300" />
<p>
  這個錯誤本質上與 FAQ 1 相同，只是 Apple 以不同訊息提醒使用者此開發者尚未驗證。請參考 FAQ 1 的解法：
</p>
<pre><code>
xattr -cr /Applications/CompressO.app
</code></pre>
<p>
  若你是透過 Homebrew 安裝 App，就不會看到這個錯誤。
</p>
<p>
  如果你不想執行這個指令，也可以對 App 按右鍵後選擇「打開」來略過警告，或直接將 App 移到垃圾桶。
</p>
</details>

<details>
<summary>
  <strong>Windows：Microsoft Defender SmartScreen 已封鎖未知的 App 啟動。執行此 App 可能會讓你的電腦面臨風險。</strong>
</summary>
<img src="assets/image-2.png" width="500" />
<p>
  這是因為你從外部來源下載了 Windows 安裝程式。Windows Defender 會在執行未知 App 前先提出警告。你可以點擊「其他資訊（More Info）」並選擇「仍要執行（Run Anyway）」來安全安裝 CompressO。
</p>
</details>

<details>
<summary>
  <strong>Debian 13 與 Ubuntu 24 無法正常使用 App</strong>
</summary>
<p>
  Tauri 目前似乎缺少一些在 Debian 13 及其衍生版本（例如 Ubuntu 24）中已被移除的套件。Tauri 團隊正在調查這個問題，因此目前暫時沒有解法。
</p>
</details>

### 授權 🚨

本專案採用 <a href="./LICENSE">AGPL 3.0</a> 授權。

本專案會打包並使用第三方軟體。完整的第三方聲明、授權與致謝資訊，請參閱 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。
