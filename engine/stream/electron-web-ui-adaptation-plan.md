# Electron/Web 双模式 UI 复用与适配执行计划

## 目标
- Electron 渲染进程完全复用 web 目录下的 React UI 代码，实现 Web/Electron 双模式。
- 通过 glue 层（Redux middleware/API 层）自动分发到主进程或本地逻辑。
- 保持 UI 代码一致性，最小化分叉和重复开发。

---

## 推荐分步 checklist

1. **入口梳理**
   - Electron 渲染进程入口加载 web/dist/index.html。
   - React UI 代码只维护一套，所有环境判断集中在 glue 层。

2. **detectMode/分发**
   - 在 glue 层实现 detectMode，判断 window.electronAPI 是否存在。
   - 通过 switch-case 分发到 Electron IPC 或本地逻辑。

3. **核心逻辑抽离**
   - 保证 engine 层 task-loop、llmService、mcpClient 为纯逻辑模块。
   - 不依赖 window、document、fetch、Electron、Node API。

4. **多端 glue 层实现**
   - Web 端 glue 层直接调用 core 逻辑。
   - Electron glue 层通过 window.electronAPI 走 IPC。
   - web-with-nodeserver glue 层通过 window.NODE_SERVER_API 或 fetch 本地端口。

5. **Redux middleware 适配**
   - 在 web/src/store/streamManagerMiddleware.ts 判断环境，分发到不同 glue 层。
   - Electron 端通过 window.electronAPI 发送/监听事件。
   - Web 端走本地逻辑。

6. **类型/工具抽离**
   - 将 engine/types、部分 utils 抽离到 shared 层，供多端/多进程共用。

7. **废弃 SSC glue**
   - 标注/废弃 SSC 相关前端适配内容，主仓库不再维护。

8. **文档同步**
   - 修订迁移计划、适配方案、入口说明等文档。

9. **测试联调**
   - 多端联调，确保分发和 glue 层行为一致。

---

## 关键细节扩充

### 1. 渲染进程入口
- Electron 主进程加载 web/dist/index.html。
- React UI 代码无需区分 Electron/Web，只在 glue 层做环境判断。

### 2. glue 层环境检测
```ts
const isElectron = !!(window && window.electronAPI);
```

### 3. glue 层分发示例
```ts
async function startTask(params) {
  if (isElectron) {
    return await window.electronAPI.startTask(params);
  } else {
    return await localTaskLoopHandler(params);
  }
}
```

### 4. Redux middleware 适配
- Electron 端通过 window.electronAPI 监听流式事件，驱动 Redux。
- Web 端直接调用 core 逻辑，事件回调驱动 Redux。

### 5. 主进程 glue 层
- 在 electron/main.js 注册 ipcMain.handle('start-task', ...)，调用 engine 纯逻辑。
- 通过 event.sender.send('task-chunk', chunk) 推送流式事件。

### 6. 类型/工具抽离
- 类型定义建议抽离到 shared/types，供主进程、渲染进程、Web 端共用。

### 7. UI 代码一致性
- 所有 React 组件、页面、路由等只维护一套。
- glue 层自动适配，无需重复开发。

---

如需主进程 glue 层代码样例、contextBridge 实现或更详细的事件结构，可进一步细化。
