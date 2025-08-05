# Electron 通信机制与 engine/task-loop 改造方案

## 目标
- 将 engine 主要逻辑（如 task-loop、llmService、mcpClient）运行在 Electron 主进程
- 渲染进程通过 IPC 与主进程通信，获取流式消息、工具调用、任务状态等
- 保证流式、事件驱动、异步响应能力

## 通信机制设计
### 1. 通信通道
- 使用 Electron 官方推荐的 `ipcMain`（主进程）与 `ipcRenderer`（渲染进程）进行消息通信
- 建议通过 `contextBridge` 暴露安全 API 到渲染进程（如 `window.electronAPI`）
- 支持请求-响应（invoke/handle）与事件推送（on/send）两种模式

### 2. 典型通信流程
- 渲染进程发起任务请求（如 `start-task`），携带参数
- 主进程收到请求，调用 task-loop/llmService 等逻辑，处理并推送流式事件（如 `task-chunk`、`task-status`、`tool-call` 等）
- 渲染进程监听事件，实时更新 UI
- 渲染进程可主动发送中断/取消等控制指令

## 关键文件与改造点
### 1. electron/main.js（主进程入口）
- 初始化 Electron 应用，加载 UI
- 引入 engine/service、engine/stream/task-loop 等模块
- 注册 ipcMain 事件监听，如：
  ```js
  ipcMain.handle('start-task', async (event, args) => {
    // 调用 task-loop 相关逻辑
    // 通过 event.sender.send('task-chunk', chunk) 推送流式数据
  });
  ```
- 负责管理 task-loop 实例、任务状态、流式推送

### 2. engine/stream/task-loop.ts
- 拆分/重构：将核心逻辑抽离为纯逻辑类，主进程直接调用
- 新增事件订阅/推送接口，便于主进程通过 IPC 推送事件
- 可选：增加“适配层”用于主进程与渲染进程的消息格式转换
- 保证所有异步/流式事件均可通过回调或事件总线推送到主进程

### 3. electron/preload.js
- 使用 contextBridge 暴露安全 API，如：
  ```js
  contextBridge.exposeInMainWorld('electronAPI', {
    startTask: (args) => ipcRenderer.invoke('start-task', args),
    onTaskChunk: (cb) => ipcRenderer.on('task-chunk', (event, chunk) => cb(chunk)),
    // ...其他事件
  });
  ```

### 4. web/（渲染进程 UI）
- 通过 window.electronAPI 调用主进程 API
- 监听流式事件，驱动 UI 状态
- 移除本地 engine 直连逻辑

## 事件与消息类型建议
- `start-task` / `stop-task` / `get-task-status` ...
- `task-chunk` / `task-status` / `tool-call` / `tool-result` ...
- 事件数据结构建议复用 engine/types 相关定义

## 迁移注意事项
- 主进程需管理所有任务实例，防止内存泄漏
- 渲染进程只暴露必要的 API，避免安全风险
- 类型定义建议抽离 shared 层，主/渲染进程共用
- 流式事件建议用事件订阅/推送模型，避免阻塞

---
如需具体代码样例或事件类型定义，可进一步细化。

---

# Server Side Client 适配说明

## 适配思路
- Server Side Client（SSC）模式下，engine 主要逻辑（如 task-loop、llmService、mcpClient）同样运行在 Node 服务端进程。
- 前端通过 HTTP/WebSocket/gRPC 等协议与服务端通信，获取流式消息、工具调用、任务状态等。
- 通信机制与 Electron 主/渲染进程类似，区别在于：
  - Electron 用 IPC（进程内消息），SSC 用网络协议（进程间/跨主机）
  - 事件推送可用 WebSocket（推荐）、SSE 或 gRPC stream

## 关键适配点
1. **engine/stream/task-loop.ts**
   - 继续保持纯逻辑/事件驱动设计，便于主进程（Electron）或服务端（Node）直接调用
   - 事件订阅/推送接口可直接复用，主进程/服务端通过事件回调推送流式数据

2. **服务端通信实现**
   - HTTP API：前端发起 REST 请求，服务端同步/异步返回结果（适合短任务）
   - WebSocket/SSE：前端建立长连接，服务端推送流式事件（如 task-chunk、task-status、tool-call 等）
   - gRPC：如需多语言/高性能可选

3. **前端适配**
   - 封装 API 层，所有 engine 相关请求均通过 HTTP/WebSocket 调用服务端
   - 监听服务端推送的流式事件，驱动 UI 状态
   - 移除本地 engine 直连逻辑

## 事件与消息类型建议
- 与 Electron 方案一致，建议复用 engine/types 相关定义
- 典型事件：`start-task`、`stop-task`、`task-chunk`、`task-status`、`tool-call`、`tool-result` 等

## 迁移注意事项
- 服务端需管理所有任务实例，防止内存泄漏
- 前端只暴露必要的 API，避免安全风险
- 类型定义建议抽离 shared 层，前后端共用
- 流式事件建议用事件订阅/推送模型，避免阻塞

## 总结
- task-loop/engine 层的事件驱动、流式推送、任务管理等设计可无缝适配 Electron 主进程与 Server Side Client 服务端
- 只需将 IPC 通信替换为 HTTP/WebSocket/gRPC 等网络协议，事件与数据结构基本一致

---
如需具体服务端通信代码样例或事件类型定义，可进一步细化。

---

> **补充说明：Server Side Client（SSC）模式**
>
> - SSC 是为“额外的 Web 项目”或第三方服务提供 HTTP/WebSocket/gRPC 接口的 Node 服务端实现。
> - 现有 Web 项目（本仓库 web/ 目录）只需适配 Electron/浏览器两端，不直接对接 SSC。
> - SSC 仅复用 engine 层部分纯逻辑代码（如 task-loop、llmService、mcpClient），但其 API/事件流专为外部 Web 客户端或第三方系统设计。
> - SSC 的前端适配、API 调用、事件 glue 等由外部 Web 项目自行实现，不影响本仓库主线 UI 代码。
> - 本仓库 web/ 目录的 streamManagerMiddleware、UI glue 等无需为 SSC 做适配。
> - SSC 主要面向“最轻量级前端”或第三方系统，前端仅需实现最基础的消息展示、输入与事件订阅，无需复杂状态管理或本地业务逻辑。
> - SSC 的 API 设计应简洁、易集成，便于任何 Web/移动端/小程序等轻前端快速对接。
> - SSC（Node 服务端）需重点关注多用户/多会话并发：每个 WebSocket/HTTP 客户端连接、每个任务请求都应独立管理 TaskLoop/上下文，避免状态串扰。
> - 推荐为每个会话/任务分配唯一 ID，使用 Map/Pool 管理所有活跃任务实例，任务完成或超时后及时清理。
> - 事件推送需带上会话/任务标识，前端可精准订阅和渲染对应消息。
> - 可结合限流、超时、资源隔离等手段，提升服务端稳定性和安全性。
