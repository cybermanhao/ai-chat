# streamManager 依赖迁移与替换计划

## 背景
- `engine/stream/streamManager.ts` 已废弃，仅作为旧实现参考。
- 新的流式/运行时消息管理请统一使用 `engine/stream/task-loop.ts`。
- 所有流式 glue、运行时状态、异步消息管理均应基于 task-loop 架构，彻底解耦 UI/Redux/业务。

## 受影响文件
- `web/src/store/streamManagerMiddleware.ts`：已迁移为 taskLoop 实现，无需再依赖 streamManager。
- `web/src/glue/webview-glue.ts`：如有流式 glue 需求，建议直接对接 taskLoop 的事件/回调。
- `engine/stream/index.ts`：已废弃 streamManager 导出，改为导出 task-loop。
- 其它如 `engine/types/chat.ts`、`web/src/store/index.ts` 等仅有注释或间接引用，无需代码层面变更。

## 迁移步骤
1. **废弃 streamManager.ts**
   - 文件顶部加 @ts-nocheck 和废弃说明。
   - 保留代码仅供参考，不再参与实际业务。
2. **移除所有直接 import/require streamManager 的代码**
   - 中间件、glue、store、组件等全部改为 taskLoop 实现。
   - 统一通过 taskLoop 事件流/回调 glue。
3. **统一流式 glue 方案**
   - 组件、glue 层如需流式 onChunk/onDone/onError，全部通过 taskLoop 的 subscribe/emit 事件流实现。
   - 不再通过 streamManager 传递流式回调。
4. **文档与注释同步**
   - 相关注释、文档全部标明“流式/运行时状态请用 task-loop，不再用 streamManager”。

## 推荐 glue/集成模式
- UI/Redux/业务层通过 new TaskLoop 实例管理每个会话/聊天。
- 通过 taskLoop.subscribe 订阅所有流式事件（如 update、toolcall、done、error 等），实现 UI 实时响应。
- 业务发起对话时调用 taskLoop.start(input)，自动进入多轮/工具链/流式处理周期。
- llmService/streamHandler 仅作为 LLM 请求和流式聚合 glue 层，taskLoop 负责 glue 到上层。
- 所有新流式/异步/运行时 glue 需求，全部基于 task-loop 架构扩展。

## 后续建议
- 新增流式/异步/运行时相关功能，全部基于 task-loop 架构。
- 保持 streamManager.ts 只读、无依赖、无导出。
- 定期清理遗留代码，确保无新代码依赖旧实现。

---
如需迁移具体代码模板或 glue 方案，可随时补充。
