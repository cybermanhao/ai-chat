
---

# engine 多端模式与服务端迁移计划

## 背景
目前 `engine` 目录下包含了 LLM 连接、MCP 协议连接、流式处理、工具链、消息管理等核心逻辑。为提升架构解耦、便于多端复用与服务化，计划在保留现有 Web 打包模式的基础上，新增 Electron 桌面端和 Server Side Client（服务端客户端）两种运行模式。

## 目标
- **Web 模式**：继续支持现有的前端 SPA/Web 打包与运行方式。
- **Electron 模式**：支持桌面端运行，集成本地/远程 LLM、MCP 服务，支持本地文件与系统能力。
- **Web with NodeServer 模式**：Web 前端通过 HTTP/WebSocket 调用本地 Node 服务（如本地部署的 streamablehttp/mcp server）。
- **Server Side Client（SSC）模式**：仅为可选扩展，具体实现和 glue 由外部项目维护，主仓库不再维护此模式的前端适配。

## 迁移范围与适配点
### 1. 服务类
- `engine/service/llmService.ts`：LLM 连接、流式对话、消息清洗、工具链 glue
- `engine/service/mcpClient.ts`：MCP 协议连接、工具调用、资源/Prompt 列表

### 2. 流处理与任务循环
- `engine/stream/streamHandler.ts`：流式 chunk 处理、工具调用分片聚合
- `engine/stream/task-loop.ts`：多轮对话、自动工具链、消息状态流、事件流

### 3. 类型与工具
- `engine/types/llm.ts`、`engine/types/chat.ts`、`engine/types/openai-extended.ts`、`engine/types/tool.ts`、`engine/types/plugin.ts` 等类型定义
- `engine/utils/` 下部分消息/ID/markdown 工具函数（如需服务端用）

## 多端模式适配方案
### 1. Web 模式
- 保持现有打包与运行方式，engine 逻辑运行在浏览器端。
- LLM/MCP 连接通过 HTTP/SSE/WebSocket 远程调用。

### 2. Electron 模式
- 新增 Electron 启动入口，engine 逻辑可运行在主进程或渲染进程。
- 支持本地 LLM/MCP 服务进程启动与管理。
- 可访问本地文件、系统资源。
- UI 层复用 Web 代码，适配 Electron API。

### 3. Web with NodeServer 模式
- Web 前端通过 HTTP/WebSocket 调用本地 Node 服务（如本地部署的 streamablehttp/mcp server）。
- 入口文件：web/ 目录下（如 web/main.tsx）
- 通过 window.NODE_SERVER_API 或 fetch 本地端口与 Node 服务通信。
- 运行方式：本地 Node 服务需单独启动，Web 前端通过本地端口访问。

### 4. Server Side Client（SSC）模式
- 仅为可选扩展，具体实现和 glue 由外部项目维护。
- 主仓库不再维护此模式的前端适配。

## 迁移与适配步骤
1. **梳理依赖**：理清 service/stream 层对 types/utils 的依赖，抽离必要类型与工具函数
2. **多端入口与配置**：为 Web/Electron/Server Side Client 分别设计入口与配置方案
3. **服务端项目初始化**：新建 server 端项目，搭建基础目录结构（service、controller、types、utils）
4. **迁移 LLM/MCP 服务**：将 llmService/mcpClient 迁移为服务端/桌面端可用模块，适配 Node/Electron 环境
5. **迁移流处理/任务循环**：将 streamHandler/task-loop 迁移为服务端/桌面端任务调度/流式处理模块
6. **API 设计与实现**：设计 REST/gRPC/WebSocket API，支持流式消息、工具链、任务状态等
7. **前端适配**：Web/Electron 前端 glue 层适配 API 调用，移除本地 LLM/MCP 直连逻辑
8. **测试与联调**：端到端测试，保证三端功能一致性

## 多端代码打包实现路径

### 1. Web 模式
- 入口文件：`web/` 目录下（如 `web/main.tsx` 或 `web/index.tsx`）
- 打包工具：Vite、Webpack 或类似工具
- 配置文件：`vite.config.ts`、`webpack.config.js` 等
- 输出目录：`dist/` 或 `web/dist/`
- 运行方式：浏览器直接访问打包后的静态资源

### 2. Electron 模式
- 入口文件：`electron/main.js`（主进程），`web/` 作为渲染进程 UI
- 打包工具：`electron-builder`、`electron-forge`、`electron-packager` 等
- 配置文件：`electron-builder.json`、`package.json` 中的 build 字段
- 输出目录：`dist-electron/` 或 `release/`
- 运行方式：`npm run electron:dev`（开发），`npm run electron:build`（打包发布）
- 关键点：主进程负责本地服务/能力，渲染进程复用 Web UI 代码

### 3. Web with NodeServer 模式
- 入口文件：`server/` 目录，如 `server/index.ts`、`server/app.ts`
- 打包工具：`tsup`、`esbuild`、`webpack`（Node target）等
- 配置文件：`tsconfig.server.json`、`server/package.json`
- 输出目录：`server/dist/`
- 运行方式：`node server/dist/index.js` 或通过 pm2/docker 部署
- 关键点：engine 逻辑迁移到 server，暴露 API，前端通过 HTTP/WebSocket 调用

### 4. Server Side Client（SSC）模式
- SSC 为可选扩展，具体实现和 glue 由外部项目维护。
- 主仓库不再维护此模式的前端适配。

### 5. 类型/工具共享
- 类型定义建议抽离到 `shared/` 或 `common/` 目录，配置 `paths` 供多端引用
- 可用 monorepo（如 pnpm workspace/yarn workspaces）统一管理依赖

## 重点注意事项
- 类型定义建议单独抽离到 shared 包，供前后端/多端共用
- 工具链/多轮任务循环需保证幂等与状态一致性
- 流式接口建议优先支持 WebSocket 或 SSE
- Electron/Server 端需关注本地依赖与安全
- 保留详细日志，便于迁移后排查问题

## 参考文件列表
- engine/service/llmService.ts
- engine/service/mcpClient.ts
- engine/stream/streamHandler.ts
- engine/stream/task-loop.ts
- engine/types/*
- engine/utils/*（如需）

## Electron 模式实现建议

### 架构设计
- **主进程**：承载 engine 绝大部分核心逻辑（如 LLM/MCP 连接、流处理、任务循环等），负责与本地/远程服务交互。
- **渲染进程**：仅负责 UI 展示与用户交互，复用 Web UI 代码。
- **通信方式**：主进程与渲染进程通过 `postMessage`（推荐用 Electron 的 `ipcMain`/`ipcRenderer` 封装）进行消息传递，实现请求-响应与流式事件推送。

### 主要实现路径
1. **主进程入口**：
   - `electron/main.js` 或 `electron/main.ts`
   - 初始化 Electron 应用，加载渲染进程页面（如 `web/dist/index.html`）
   - 在主进程中引入/初始化 engine 相关模块（如 `engine/service/llmService`、`engine/stream/task-loop` 等）

2. **渲染进程入口**：
   - 复用 `web/` 目录下的 UI 代码
   - 通过 `window.electronAPI` 或 `ipcRenderer.postMessage` 发送请求到主进程
   - 监听主进程返回的消息/流式事件，更新 UI

3. **主进程通信实现**：
   - 使用 `ipcMain.on('llm-request', handler)` 监听渲染进程请求
   - 处理请求后，通过 `event.reply` 或 `webContents.postMessage` 返回结果/流式数据
   - 支持流式消息、工具调用、任务状态等事件推送

4. **渲染进程通信实现**：
   - 封装 API 层，所有 engine 相关请求均通过 postMessage 发送到主进程
   - 监听主进程返回的响应/事件，驱动 UI 状态

5. **打包与运行**：
   - 开发：`npm run electron:dev`，主进程热重载+渲染进程热更新
   - 打包：`npm run electron:build`，主进程与渲染进程分别打包，产物合并到 `dist-electron/` 或 `release/`

### 关键注意事项
- 主进程需隔离 Node/本地依赖，渲染进程只暴露安全 API
- 流式事件建议用事件订阅/推送模型，避免阻塞
- 可用 `contextBridge` 暴露安全 API 给渲染进程
- engine 相关类型建议抽离到 shared 层，主/渲染进程共用

---
如需详细迁移子任务或多端入口样例，可进一步细化。
