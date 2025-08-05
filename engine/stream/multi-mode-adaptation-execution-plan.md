# engine 层多端适配重构执行计划

## 1. 明确主入口和分发点
- 明确 engine 层的“入口 glue 层”文件（如 `engine/stream/streamHandler.ts`、`engine/stream/task-loop.ts`、`engine/service/llmService.ts`、`engine/service/mcpClient.ts`），确定哪些需要 runtime 分发。
- 设计/抽象统一的 `detectMode` 和分发方法（如 `handleTaskRequest`），并在入口处调用。

## 2. 拆分/重构核心逻辑
- 将核心业务逻辑（如 task-loop、llmService、mcpClient）抽离为纯逻辑类/函数，保证可在 Web、Electron 主进程、NodeServer 复用。
- 保证这些核心逻辑不依赖于具体的前端/渲染层 API。

## 3. 实现多端适配 glue 层
- 在 engine 层新增/重构 glue 层（如 `engine/entrypoint.ts` 或中间件），实现 switch-case 分发（参考 `multi-mode-switch-sample.md`）。
- Web 端：直接调用本地逻辑。
- Electron：通过 `window.electronAPI` 走 IPC。
- web-with-nodeserver：通过 `window.NODE_SERVER_API` 或 fetch 本地端口。
- SSC：仅保留接口说明，主仓库不再维护 glue。

## 4. 前端/Redux middleware 适配
- Web 端 Redux middleware 保持原有本地调用。
- Electron 端 middleware 改为通过 `window.electronAPI` 发送/监听事件（参考 `electron-streamManagerMiddleware-adapter.md`）。
- web-with-nodeserver 端可通过 API 层适配。

## 5. 类型与工具抽离
- 将 engine/types、部分 utils 抽离到 shared 层，供多端/多进程共用。

## 6. 废弃/标注过期 SSC 相关内容
- 明确注释/文档标注 SSC 相关前端适配为“已废弃/仅供扩展”，主仓库不再维护。

## 7. 文档同步与精简
- 持续同步迁移计划、适配方案、入口说明等文档，精简过期内容，保持文档与主线实现一致。

---

## 推荐分步 checklist

1. 【入口梳理】明确 engine 层 runtime 分发的主入口文件和 glue 层。
2. 【detectMode/分发】实现/完善 detectMode 及 switch-case 分发 glue。
3. 【核心逻辑抽离】重构 task-loop、llmService、mcpClient 为纯逻辑模块。
4. 【多端 glue 实现】分别实现 Web/Electron/web-with-nodeserver 的 glue 层适配。
5. 【Redux middleware 适配】重构 web、electron 端的 Redux middleware glue。
6. 【类型/工具抽离】将类型定义、工具函数抽离到 shared 层。
7. 【废弃 SSC glue】标注/废弃 SSC 相关前端适配内容。
8. 【文档同步】修订迁移计划、适配方案、入口说明等文档。
9. 【测试联调】多端联调，确保分发和 glue 层行为一致。

---

### Web 模式 glue 层实现建议
- 直接在 glue 层调用 core 纯逻辑模块（如 new TaskLoopCore(params)）。
- 通过回调/事件订阅获取流式数据和状态变更，直接驱动 Redux/组件。
- 不依赖 window.electronAPI、Node API，仅用浏览器原生能力。
- 典型代码：
  ```ts
  const taskLoop = new TaskLoopCore(params);
  taskLoop.onChunk(chunk => dispatch(...));
  taskLoop.onStatus(status => dispatch(...));
  taskLoop.start();
  ```

### SSC 模式 glue 层实现建议
- 仅作为可选扩展，主仓库不维护前端 glue。
- SSC 服务端通过 HTTP/WebSocket/gRPC 暴露 API，前端通过网络协议调用。
- glue 层只负责请求/订阅服务端 API，不直接依赖本地 core 逻辑。
- 典型代码：
  ```ts
  // 通过 fetch/WebSocket 调用 SSC 服务端
  fetch('/api/start-task', { ... })
  // 或 WebSocket 订阅流式事件
  ws.on('task-chunk', chunk => ...);
  ws.on('task-status', status => ...);
  ```
- 事件结构、参数建议与 core 保持一致，便于第三方前端快速集成。

---

如需针对每一步的详细文件/模块建议或代码样例，可进一步细化。
