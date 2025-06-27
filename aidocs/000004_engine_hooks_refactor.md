| 时间         | 时间类型     | 情况摘要                         | 我的要求摘要                 |
| ------------ | ------------ | -------------------------------- | ---------------------------- |
| 2024-07-17   | 创建时间     | engine/hooks 目录 hooks 迁移与现代 redux 架构重构建议 | 输出重构建议并执行           |
| 2024-07-17   | 最后更新时间 | 首次输出                         | -                          |

---

## 正文主体

### 1. 背景与目标

- 现有 engine/hooks 目录下包含 useChatMessages.ts、useLLMConfig.ts、useModelConfig.ts、useModelSelection.ts 等 React hooks 风格文件。
- 现代 redux 架构下，engine 层应只负责业务逻辑、数据结构、算法、服务，全部用纯函数、class（如 ChatMessageManager、llmStreamManager、toolCallHandler）实现，不应包含 React hooks。
- 目标：彻底移除 engine/hooks 目录，将所有 useXXX 相关逻辑迁移为 engine/utils、engine/service、engine/store 下的纯函数或 class，由 web 层 hooks 负责 UI glue。

### 2. 具体重构建议

1. **彻底移除 engine/hooks 目录**，将所有 useXXX 文件删除。
2. **如有业务逻辑需要被 UI 层复用，全部迁移为 engine/utils、engine/service、engine/store 下的纯函数或 class。**
3. **web 层 hooks（如 useChatMessages）只做 UI glue，内部调用 engine 层纯函数/服务。**
4. **组件全部用 redux/useSelector/useDispatch + engine 层 manager/工具函数。**

### 3. 迁移后目录结构建议

```
engine/
  utils/
    ChatMessageManager.ts
    llmStreamManager.ts
    toolCallHandler.ts
    ...
  service/
    ...
  # 不再有 hooks 目录

web/src/hooks/
  useChatMessages.ts   # 只做 UI glue
  ...
```

### 4. 迁移注意事项
- 删除 hooks 前，需全局搜索引用，确保无残留。
- 业务逻辑迁移 engine 层时，避免引入 React/前端依赖。
- 迁移后，package.json 可移除 zustand 依赖。

---

如需具体迁移脚本或样板代码，或有特殊业务场景，欢迎团队成员随时补充！ 