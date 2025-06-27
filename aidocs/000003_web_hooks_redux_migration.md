| 时间         | 时间类型     | 情况摘要                         | 我的要求摘要                 |
| ------------ | ------------ | -------------------------------- | ---------------------------- |
| 2024-07-16   | 创建时间     | web/src/hooks 目录 hooks 迁移与 redux 架构重构分析 | 记录所有 hooks 的迁移与替代方案 |
| 2024-07-16   | 最后更新时间 | 首次输出                         | -                          |

---

## 正文主体

### 1. 迁移背景与目标

- 现有 web/src/hooks 目录下 hooks 多为 zustand 相关或业务逻辑 hooks。
- 按 @redux-multi-platform-best-practice.md 和 @web-chat-call-path-analysis.md，web 层全局状态应全部迁移到 redux，业务逻辑沉淀到 engine 层，UI 只用 redux hooks。
- 目标：彻底移除 zustand 依赖，所有全局状态用 redux slice，业务 hooks 迁移为 engine 层纯函数/工具。

### 2. hooks 现状与迁移判断

| hooks 文件                | 现有用途/依赖                | 是否已被替代/迁移建议                |
|--------------------------|------------------------------|--------------------------------------|
| useModelSelection.ts      | re-export engine hook        | 直接用 redux selector，建议删除       |
| useModelConfigStore.ts    | zustand store                | 已被 redux slice 替代，建议删除       |
| useModelConfig.ts         | 依赖 useModelConfigStore     | 已被 redux slice 替代，建议删除       |
| useLLMConfig.ts           | zustand store                | 已被 redux slice 替代，建议删除       |
| useToolCallHandler.ts     | 纯业务逻辑 hook              | 迁移到 engine/utils/service 作为纯函数 |
| useLLMStreamManager.ts    | LLM 流式消息管理，部分 UI 依赖 | 业务部分迁移 engine，UI 用 redux      |

### 3. 具体迁移/重构方案

#### 3.1 彻底删除 hooks
- useModelSelection.ts、useModelConfigStore.ts、useModelConfig.ts、useLLMConfig.ts：
  - 检查无引用后直接删除。
  - 相关全局状态全部用 redux slice（如 llmConfigSlice、modelConfigSlice、chatSlice 等）。
  - 组件全部用 useSelector/useDispatch/selectors。

#### 3.2 业务逻辑 hooks 迁移
- useToolCallHandler.ts：
  - 迁移到 engine/utils 或 engine/service，重构为纯函数或 class。
  - 供 redux thunk/engine 层/组件直接调用。
- useLLMStreamManager.ts：
  - 业务部分迁移到 engine/utils/llmStreamManager.ts。
  - UI 相关部分（如 setIsGenerating、scrollToBottom）用 redux 控制。
  - 组件只用 redux hooks/selectors。

#### 3.3 迁移后目录结构建议
- engine/utils/llmStreamManager.ts：流式管理纯函数
- engine/utils/toolCallHandler.ts：工具调用纯函数
- web/src/store/xxxSlice.ts：所有全局状态
- web/src/components/xxx：全部用 useSelector/useDispatch

### 4. 迁移注意事项
- 删除 hooks 前，需全局搜索引用，确保无残留。
- 业务逻辑迁移 engine 层时，避免引入 React/前端依赖。
- 迁移后，package.json 可移除 zustand 依赖。

---

如需具体迁移脚本或样板代码，或有特殊业务场景，欢迎团队成员随时补充！ 