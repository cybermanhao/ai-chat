# Electron LLM/MCP IPC 适配方案

## 目标
- 实现 Electron 渲染进程（前端页面/5713端口）所有 LLM/MCP 相关请求均通过 IPC 发送到主进程，由主进程统一代理 llmService/mcpService。
- 保证 Web 环境下逻辑不变，Electron 下自动切换 glue 层。
- 提高安全性、能力扩展性，前端 UI 代码最大复用。

## 方案概述
1. **环境检测**：通过 `detectRuntimeMode()` 或 `window.electronAPI` 判断当前是否 Electron 渲染进程。
2. **渲染进程 glue**：llmService/mcpService 在 Electron 下仅做 IPC 封装（如 `window.electronAPI.invoke('llm-chat', params)`），Web 下走原有实现。
3. **主进程 handler**：Electron 主进程监听所有相关 IPC 事件（如 `llm-chat`、`mcp-callTool`），调用本地 Node 侧 llmService/mcpService 并返回结果。
4. **task-loop glue**：保持在渲染进程，依赖的 llmService/mcpService glue 自动分发，无需改动业务逻辑。

## 步骤拆解
### 1. 拆分 glue 层
- `engine/service/llmService.ts`、`mcpService.ts` 检测 Electron 环境时只发 IPC，不再包含 SDK/HTTP 逻辑。
- 可选：主进程专用实现单独放在 `electron/llmService.electron.ts`、`mcpService.electron.ts`。

### 2. 渲染进程 glue 示例
```ts
// llmService.ts (渲染进程)
import { detectRuntimeMode } from 'engine/stream/envDetect';
export async function streamLLMChat(params) {
  if (detectRuntimeMode() === 'electron' && window.electronAPI) {
    return await window.electronAPI.invoke('llm-chat', params);
  }
  // ...原有 Web 实现...
}
```

### 3. 主进程 handler 示例
```js
// main.js (主进程)
import { streamLLMChat } from '../engine/service/llmService.js';
import { MCPClient } from '../engine/service/mcpService.js';
const mcpService = new MCPService(/* ... */);
ipcMain.handle('llm-chat', async (event, params) => {
  return await streamLLMChat(params);
});
ipcMain.handle('mcp-callTool', async (event, { name, args }) => {
  return await mcpService.callTool(name, args);
});
```

### 4. 纯 Web 环境
- 直接走原有 HTTP/SDK 实现，无需 glue。

### 5. 其他建议
- 所有 glue 层均应类型安全，主进程 handler 需捕获异常并返回错误。
- 可扩展更多 IPC 事件（如工具列表、流式事件等）。
- 业务层（如 task-loop）无需感知 glue 细节，保持最大解耦。

## 里程碑
- [ ] 拆分 glue 层，渲染进程只发 IPC
- [ ] 主进程注册所有 handler
- [ ] 联调测试，确保 Electron/Web 行为一致
- [ ] 文档补充与类型完善
