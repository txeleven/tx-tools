# TX JS工具箱 (tx-js-toolbox)

面向程序员的 JS 开发工具 Chrome 浏览器扩展（Manifest V3 + Vue 3 + Vite）。所有计算均在本地完成，数据不会离开浏览器。

## 功能

**Popup 高频工具**（点击工具栏图标打开）：
- JSON 格式化 / 压缩 / 校验 / 排序
- Base64 编解码（支持中文 UTF-8）
- Unix 时间戳 ↔ 日期转换
- MD5 / SHA-1 / SHA-256 / SHA-512

**Options 完整工具箱**（15 个工具，独立标签页）：
- JSON 格式化、JSON 转 TypeScript
- 代码格式化/美化（JS / CSS / HTML / SQL / XML / PHP / Python，带语法高亮）
- 代码压缩（JS / PHP / Python）
- 代码检查（JS Lint）
- 代码加密（JS 混淆）
- Base64、URL 编解码、HTML 实体、Unicode 转义
- 哈希计算（MD5/SHA 系列）
- 时间戳转换、JWT 解析
- 正则测试器（含常用正则库）
- UUID 生成、随机密码生成
- 命名风格转换、进制转换、颜色转换（HEX/RGB/HSL）
- JSON Diff 对比、Markdown 预览
- 设置页（中英双语切换）

**右键菜单**：网页选中文本 → 右键 → Base64 解码 / JSON 格式化 / 时间戳转日期 / URL 解码，结果自动复制到剪贴板。

## 技术栈

- **Manifest V3**（Chrome 114+，`chrome.offscreen` 用于后台剪贴板）
- **Vue 3** + **Vite 6** 多页面构建（popup + options）
- 零第三方运行时依赖：MD5 为纯 JS 实现，SHA 走 WebCrypto，图标为纯 Node 生成
- 自研轻量 i18n（`zh-CN` / `en-US`）

## 环境要求

- **Node.js 18+**（推荐 20+，Vite 6 要求）
- **Chrome 114+**（`chrome.offscreen` 剪贴板；109+ 部分可用）

## 安装依赖

```bash
npm install
```

## 打包方法（构建）

```bash
npm run build
```

构建过程：
1. `scripts/generate-icons.mjs` 纯 Node 生成 4 个尺寸图标（16/32/48/128）
2. Vite 多页面构建（popup + options），产物输出到 `dist/`

产物结构：

```
dist/
├── manifest.json              # MV3 清单
├── background/service-worker.js
├── offscreen.html / offscreen.js
├── popup/                     # 高频工具弹窗页
├── options/                   # 完整工具箱页
└── assets/                    # 打包后的 JS / CSS
```

其他脚本命令：

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Vite dev server（http://localhost:5173），调试页面 UI |
| `npm run build` | 生成图标 + 生产构建到 `dist/` |
| `npm run icons` | 仅重新生成图标（不构建） |
| `npm run preview` | 本地预览构建产物（http://localhost:4173） |

> 注：`dev` 模式用于调试 popup/options 页面本身；浏览器扩展能力（右键菜单、后台剪贴板）必须通过加载 `dist/` 才可用。

## 访问方法（安装 / 运行）

### 1. 加载到 Chrome（主要使用方式）

1. 先执行 `npm run build`
2. 打开 Chrome，地址栏输入 `chrome://extensions`
3. 右上角开启「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择本项目的 `dist/` 目录

加载后：
- **打开 Popup**：点击浏览器工具栏的扩展图标
- **打开完整工具箱**：在 popup 中点击「打开完整工具箱」，或在 `chrome://extensions` 扩展卡片点击「详情」→「扩展程序选项」
- **使用右键菜单**：任意网页选中文本 → 右键 → TX 工具箱菜单

### 2. 修改后重新加载

每次改动源码后：

```bash
npm run build
```

然后到 `chrome://extensions` 点击扩展卡片上的**刷新按钮**（↻）重新加载。

### 3. 浏览器页面直接访问（仅调试）

不加载扩展时，可直接访问构建产物页面预览 UI：

- `dist/popup/index.html` — Popup 页面
- `dist/options/index.html` — 完整工具箱页面

或运行 `npm run dev` / `npm run preview` 后在浏览器打开对应页面。

## 项目结构

```
├── public/                    # 原样复制到 dist
│   ├── manifest.json          # MV3 清单
│   ├── background/service-worker.js   # 右键菜单 + 剪贴板
│   ├── offscreen.html/js      # MV3 剪贴板文档
│   └── icons/                 # 构建时自动生成
├── src/
│   ├── popup/                 # 高频工具弹窗
│   ├── options/               # 完整工具箱 + 设置
│   ├── components/            # 14 个工具组件（popup/options 复用）
│   ├── tools/                 # 纯函数工具库 + 工具注册表
│   ├── i18n/                  # 中英双语
│   ├── styles/                # 全局样式（含语法高亮配色）
│   └── utils/                 # 剪贴板 / toast
├── scripts/generate-icons.mjs # 纯 Node 图标生成器
├── vite.config.js             # Vite 多页面配置
└── package.json
```

## 注意事项

- MV3 CSP 禁止远程脚本，所有代码本地打包，无 CDN 依赖
- `chrome.offscreen` 需要 Chrome 109+，右键菜单复制功能依赖它
- 扩展内 `btoa/atob` 直接可用（`chrome-extension://` 为安全上下文）
- 语法高亮为自研轻量实现（token 类名 `hl-*`），与 `js-beautify`、`marked`、`qrcode` 等本地依赖一起打包，无远程加载
