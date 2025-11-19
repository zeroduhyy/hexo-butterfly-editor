**Hexo-Butterfly Editor**

- **说明**: 这是一个面向 Hexo + Butterfly 主题的本地文章编辑器与素材管理前端，包含一个简单的后端用于读取/保存 Markdown 文章、上传图片并预览本地图片。前端由 Vite + React 开发，后端使用 Express（Node）。

**Features**
- **文章管理**: 浏览 / 创建 / 删除 Markdown 文件（source/_posts）。
- **图片管理**: 列出并上传图片到 `source/img`（支持按文章子文件夹组织）。
- **实时预览**: 编辑 Markdown 并查看大致预览（渲染依赖 Hexo 主题差异，仅供参考）。
- **本地设置存储**: 后端会在仓库目录生成 `config.json` 保存 `postsPath` 与 `imagesPath`。

**Requirements**
- Node.js >= 18
- npm 或兼容包管理器

**快速开始（开发）**
- 克隆仓库并安装依赖：

```powershell
git clone <repo-url>
cd hexolocal-editor
npm install
```

- 启动前后端开发模式（同时启动后端与 Vite 前端）：

```powershell
npm run dev
```

- 打开浏览器访问： `http://localhost:5173`。

**项目结构（重要文件）**
- `index.html`：前端入口页面（注意：开发中已移除直接指向 CDN 的 importmap，Vite 使用本地 `node_modules`）。
- `index.tsx` / `App.tsx`：React 入口与应用。 
- `server.js`：简单 Express 后端，监听 `3000` 端口，提供 `/api/*` 接口。
- `config.json`：后端在运行时用于保存 `postsPath` 与 `imagesPath`（本地生成，应加入 `.gitignore`）。

**配置说明**
- 首次运行或在前端设置中保存设置时，后端会在仓库根创建 `config.json`，格式例如：

```json
{
  "postsPath": "C:/path/to/your/hexo/source/_posts",
  "imagesPath": "C:/path/to/your/hexo/source/img"
}
```

- 也可以手动创建 `config.json`（仅用于本地开发），并确保路径正确且可读写。

**端口与代理（开发）**
- 后端默认运行在 `http://localhost:3000`。
- Vite 开发服务器运行在 `http://localhost:5173`，前端通过 Vite 的 `server.proxy` 将以 `/api` 开头的请求代理到后端（配置在 `vite.config.ts`）。

**生产构建与部署**
- 构建前端：

```powershell
npm run build
```

- 构建结果会输出到 `dist/`。生产部署有两种常见方式：
- - 静态站点 + 后端 API：将 `dist/` 的静态文件托管在任意静态服务器（NGINX、Vercel、Netlify 等），并部署后端 `server.js` 在支持 Node 的主机（或将 API 单独部署）。若静态与后端部署在同一域名下，请确保 `/api` 路由正确指向后端。
- - 单机部署（快速方法）：将 `dist/` 的静态文件拷贝到 `server` 可访问的目录，并在 `server.js` 中添加静态托管逻辑（示例未内置）。如果需要，我可以为你添加一个简单的静态文件服务路由来在 Express 中直接提供 `dist/`。

**常见问题（Blank / 空白页 调试）**
- **只看到深色背景但无 UI 元素**:
  - 确保你运行的是 `npm run dev`（不是 `npm dev run`）。正确命令会同时启动 `server` 与 `client`。
  - 打开浏览器开发者工具（F12），查看 **Console**（红色错误）和 **Network**（是否有 `index.tsx` 或 JS/CSS 资源加载失败或 404）。
  - 一个常见原因是 `index.html` 中的 `importmap` 强制从 CDN 加载 React/ReactDOM，导致与 Vite 的模块解析冲突。此仓库已移除该 importmap，以确保本地使用 `node_modules` 的 React。如果你在云端使用 importmap，请在构建/部署流程中区分两者。

- **后端连接失败 / 列表为空**:
  - 检查 `server.js` 是否运行（`node server.js` 或 `npm run dev` 启动后端）。
  - 确认 `config.json` 中的 `postsPath` 与 `imagesPath` 指向正确的 Hexo 目录并且 Node 进程有权限读取/写入。

**安全与忽略**
- 本仓库已将 `config.json` 与常见本地文件添加到 `.gitignore`，避免将本地路径与敏感信息推送到远程。

**想要我帮忙的点**
- 我可以：
  - 把 `server.js` 增加静态 `dist/` 托管逻辑以便单机部署；
  - 添加启动脚本来区分 `dev`（本地）与 `prod`（生产）中是否插入 CDN `importmap`；
  - 或者帮你查看并修复你遇到的控制台错误（把 Console 的错误贴上来即可）。

**贡献与许可证**
- 欢迎提 PR 或 issue。默认无特殊许可证；如果需要我可以帮你添加 `LICENSE` 文件。

----
_作者: Hexo-Butterfly 编辑器 项目组_
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/14_7gsra64uzFvMEt7EeZFUsc0F7YUmMI

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
