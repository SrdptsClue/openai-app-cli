# OpenAI Apps CLI

面向 Model Context Protocol (MCP) 的轻量级 Chat App 框架，提供多入口前端、可部署的服务端以及完整的构建脚本，帮助你在 ChatGPT 中快速接入自定义 Widget。当前文档适用于 `v1.0.0`。

## 核心特性

- 多 Widget 架构：`src/app/*/index.tsx` 每个目录都是一个独立入口，开发时自动生成调试页面，构建后输出独立的 HTML 片段和静态资源。
- MCP 一体化服务：基于 Hono 启动 SSE 服务器，暴露 `/mcp` 与 ChatGPT Sandbox 对接，自动注册工具、资源模版并返回 Widget HTML（见 `server/helper/mcp-server.ts`、`server/base/widgetProvider.ts`）。
- 自定义构建流程：`pnpm run build` 调用 `build.mts`，同时编译服务端与客户端，对静态资源加上版本号，输出到 `output/` 目录并为每个 Widget 生成独立 HTML。
- 全局状态与宿主通讯：通过 `window.openai` 读取和写入 `toolOutput`、`widgetState` 等字段，提供 `useOpenAiGlobal`、`useWidgetState` 等 React Hook，便于与 ChatGPT 主站同步状态。
- 国际化即插即用：内置 50+ 语言 JSON 文案，`BaseRoot` 监听宿主传入的 `locale` 自动切换，默认语言为英文。

## 环境与安装

- 前置依赖：Node.js ≥ 18、pnpm ≥ 8
- 安装依赖：
  ```bash
  pnpm install
  ```

复制 `.env.example` 为 `.env`，按需调整：

```bash
cp .env.example .env
```

必填字段：

- `PORT`、`HOST`：服务端监听地址
- `REMOTE_ASSETS_ORIGIN`：构建产物中静态资源的访问域名（默认为本地服务地址）

## 常用命令

- `pnpm run dev`：Vite 多入口开发模式，访问 `http://localhost:<PORT>/` 查看 Widget 列表。
- `pnpm run build`：执行 `build.mts`，产出 `output/index.mjs` 与 `output/assets/`。
- `pnpm run start`：在构建后运行 `node output/index.mjs`，启动 MCP SSE 服务。

## 目录速览

```text
├── src/
│   ├── app/           # Widget 入口（每个目录对应一个 Widget）
│   ├── component/     # 客户端共享组件
│   ├── i18n/          # i18next 初始化与语言配置
│   ├── locales/       # 多语言 JSON 文案
│   └── openai/        # 与 window.openai 交互的 Hook
├── server/            # MCP 服务端与工具注册逻辑
├── output/            # 构建产物（执行 build 后生成）
└── build.mts          # 自定义构建脚本
```

## MCP 服务说明

- SSE Endpoint：`/mcp`（见 `server/helper/app.ts`），采用 `@hono/mcp` 提供的 `StreamableHTTPTransport`。
- 注册的工具与资源定义在 `server/config.ts`，默认包含 `example` 工具：
  - Tool 名称：`example`
  - 输入参数：`exampleTip`（字符串）
  - 响应内容：文本 `"Rendered a example!"`，并附带结构化参数回传
- `WidgetProvider` 会从构建产物中读取 `example.html`，为 MCP 响应附加 `openai/outputTemplate` 等元数据，使 ChatGPT 能直接渲染 Widget。

## 客户端 Widget 开发流程

> Tailwind CSS 自定义配置在新版本中迁移到了 `src/index.css` 中，具体规则详见 [Tailwindcss Theme variables](https://tailwindcss.com/docs/theme)

1. 在 `src/app/<widget-name>/` 下创建 `index.tsx`，使用 `createAppPage("<widget-name>", <App />)` 挂载组件，并可选引入局部样式。
2. 使用 `BaseRoot` 包裹根节点，它会监听宿主传入的语言并调用 `changeLanguage`。
3. 通过 `useOpenAiGlobal("toolOutput")`、`useWidgetProps()` 等 Hook 获取宿主提供的数据；如需持久化状态，可使用 `useWidgetState()` 写回 `window.openai.setWidgetState`。
4. 新增 Widget 后，更新 `server/config.ts` 的 `widgetCollection`，指定 `id`、`title`、`templateUri` 与校验 Schema。
5. 运行 `pnpm run build` 重新生成 HTML 片段；`WidgetProvider` 会在启动时读取最新构建结果。

示例组件（`src/app/example/index.tsx`）展示了如何读取 `toolOutput`，以及渲染国际化文案：

```tsx
function App() {
  const [t] = useTranslation()
  const toolOutput = useOpenAiGlobal("toolOutput")
  ...
  return <h1>{t("examle.title")}</h1>
}
```

## 构建输出

- `output/index.mjs`：经过 `tsup` 打包压缩的服务端入口。
- `output/assets/`：每个 Widget 对应一个 `<name>.html` 入口文件，以及带哈希的 `chunks/*.js` 和 `static/*` 资源。
- 构建脚本会根据 `REMOTE_ASSETS_ORIGIN` 生成 `<script type="module">` 与 `<link rel="stylesheet">`，便于部署时将静态资源托管到独立域名。

## 生产部署建议

1. 执行 `pnpm run build`，确保 `output/` 目录就绪。
2. 将 `output/` 上传到服务器，保证服务端进程可访问到同级的 `assets/` 目录。
3. 在部署环境配置 `.env`（至少 `PORT`、`HOST`、`REMOTE_ASSETS_ORIGIN`）。
4. 使用进程管理工具（如 pm2/systemd）运行 `node output/index.mjs`，并通过反向代理暴露 `/mcp` 和 `/assets/`。

## 许可证

当前项目遵循 MIT License 开源协议（参见 `package.json` 中的 `license` 字段）。
