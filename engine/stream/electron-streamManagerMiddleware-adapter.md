# Electron 渲染进程适配 streamManagerMiddleware 示例

本示例展示如何将原有 Web 端直接调用 TaskLoop 的 Redux middleware，适配为通过 Electron IPC 与主进程通信的实现方式。

---

## 1. 判断运行环境
```typescript
const isElectron = !!(window && window.electronAPI);
```

## 2. 发送任务请求与监听事件

```typescript
const taskLoopMiddleware: Middleware = (storeAPI: any) => next => async action => {
  if (sendMessage.match(action)) {
    const { chatId, input } = action.payload;
    // ...参数准备逻辑...

    if (isElectron) {
      // 通过 IPC 向主进程发起任务
      window.electronAPI.startTask({ chatId, input, ...其他参数 });
      // 监听流式事件
      window.electronAPI.onTaskChunk((chunk) => {
        storeAPI.dispatch(patchLastAssistantMessage({ chatId, patch: chunk }));
      });
      window.electronAPI.onTaskStatus((status) => {
        storeAPI.dispatch(setMessageCardStatus({ chatId, status }));
      });
      window.electronAPI.onToolCall((toolCall) => {
        // ...dispatch setToolCallState ...
      });
      window.electronAPI.onToolResult((toolResult) => {
        // ...dispatch updateToolCallState ...
      });
      window.electronAPI.onTaskDone(() => {
        storeAPI.dispatch(setIsGenerating({ chatId, value: false }));
        storeAPI.dispatch(setMessageCardStatus({ chatId, status: 'stable' }));
      });
      window.electronAPI.onTaskError((error) => {
        storeAPI.dispatch(setError(error));
        storeAPI.dispatch(setIsGenerating({ chatId, value: false }));
        storeAPI.dispatch(setMessageCardStatus({ chatId, status: 'stable' }));
      });
      return;
    } else {
      // Web 直连模式（保留原有逻辑）
      // ...原有 TaskLoop 逻辑...
    }
  }
  // ...stopGeneration 逻辑同理，发送 stopTask 到主进程...
  return next(action);
};
```

## 3. 主进程与 preload 适配
- 主进程监听 `start-task`，创建/管理 TaskLoop 实例，推送事件到渲染进程
- preload.js 用 contextBridge 暴露 API

```js
// preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  startTask: (args) => ipcRenderer.invoke('start-task', args),
  stopTask: (args) => ipcRenderer.invoke('stop-task', args),
  onTaskChunk: (cb) => ipcRenderer.on('task-chunk', (event, chunk) => cb(chunk)),
  onTaskStatus: (cb) => ipcRenderer.on('task-status', (event, status) => cb(status)),
  onToolCall: (cb) => ipcRenderer.on('tool-call', (event, toolCall) => cb(toolCall)),
  onToolResult: (cb) => ipcRenderer.on('tool-result', (event, toolResult) => cb(toolResult)),
  onTaskDone: (cb) => ipcRenderer.on('task-done', (event) => cb()),
  onTaskError: (cb) => ipcRenderer.on('task-error', (event, error) => cb(error)),
});
```

---

## 4. 事件与数据结构
- 事件结构建议与 Redux action payload 保持一致，类型定义可复用 engine/types

---

如需主进程事件推送代码样例或更详细的类型定义，可进一步细化。
