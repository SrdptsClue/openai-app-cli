# OpenAI App AI 开发指南（Codex 专用）

本文档面向新的 Codex 会话，浓缩了项目约定、目录结构与开发流程，用于确保每次协作都能快速对齐。

## 核心目标

- 构建一个**轻量可运行**的 Chat App 示例，具备基础工程化能力。
- 坚持“**简单优先**”：不做过度设计、不写冗余代码、不处理额外兼容性。
- 所有功能必须真实可用，禁止“模拟实现”或占位逻辑。

## 编码原则

- 代码必须**简洁、直接、可读**，宁可少逻辑也不要复杂化。
- 维持“**乐观假设**”：相信输入正确，不额外做校验、兜底或类型防御。
- 如遇不确定需求，先向用户确认再执行；禁止擅自添加新功能。
- 只在必要时拆分文件，一个文件聚焦一类职责；若内容很少可保持在同一文件。
- 若用户反馈问题，先分析原因再改动，避免盲目修修补补。

## 目录结构

```tree
├── .AI                # AI 自用资料与脚本目录
│   ├── doc
│   └── scripts
├── output/            # 构建产物目录
│   ├── assets/        # client 打包资源（带 hash 版本与固定版本）
│   └── server.js      # server 打包结果
├── src/
│   ├── client/        # 前端入口，每个资源一个子目录，入口为 index.tsx
│   ├── server/        # MCP 服务端逻辑（index.ts 等）
│   ├── components/    # 公共组件
│   └── utils/         # 公共工具函数
├── build.mts          # 构建脚本（Vite 构建 client、esbuild 打包 server）
├── ...                # 环境相关配置文件
└── package.json
```

## 运行环境

- Node.js ≥ 18
- pnpm ≥ 8（建议全局安装）
- 依赖安装：`pnpm install`

## 开发流程

1. 启动开发服务器：`pnpm run dev`
   - `vite.config.mts` 会扫描 `src/client/*/index.tsx`，为每个资源生成独立入口。
   - 首页 `/` 自动列出可调试的资源链接。
   - **Fast Refresh 约定**：入口模块需导出组件（例如 `export function App()`），否则 Vite 会提示 `"true" export is incompatible"。
2. 资源目录要求：
   - `src/client/<name>/index.tsx` 必须负责挂载并导出组件。
   - 在入口顶部显式 `import "./index.css"`（若存在样式），以便打包时生成独立 CSS。
   - 可使用 `src/utils/cn.ts` 中的 `cn` 辅助函数管理类名。

## 构建与部署

执行 `pnpm run build`：

- `build.mts` 将：
  1. 使用 Vite 为每个资源生成 `output/assets/<name>.js` 与 `<name>.css`；
  2. 基于 `package.json.version` 计算短 hash，将 `.js/.css` 重命名为 `<name>-<hash>.ext`；
  3. 生成两份 HTML：
     - `<name>-<hash>.html`：引用带 hash 的脚本与样式，可长时间缓存。
     - `<name>.html`：固定名称，始终指向最新版本，便于服务端查找。
  4. 使用 esbuild 将 `src/server/index.ts` 打包为 `output/server.js`。

> **运行**：`node output/server.js`

## 服务端行为速览

- 服务端在启动时读取 `output/assets`：
  - 优先加载 `<name>.html`，若不存在再回退到最新的 `<name>-*.html`。
  - HTML 内部已内联带 hash 的 `<script type="module">` 与 `<link rel="stylesheet">`。
- MCP SSE 与消息路由逻辑位于 `src/server/index.ts`，保持原始项目的工具与资源接口。

## 常见注意事项

- 修改入口组件时保持具名导出，避免 Fast Refresh 警告。
- 避免直接改动 `output/` 内文件，它们由 `build.mts` 自动生成。
- 需要新增资源时，只需在 `src/client` 下新增 `<name>/index.tsx`，运行 `pnpm run dev/build` 即可。

## 命令速查

- `pnpm run dev`：本地多入口预览（端口 4444）。
- `pnpm run build`：生成 `output/` 目录产物。
- `node output/server.js`：启动服务端。

> 若遇到构建或运行问题，按照“先查原因再改动”的原则处理，并与用户确认需求是否发生变化。
