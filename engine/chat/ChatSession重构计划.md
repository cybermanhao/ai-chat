
# 以下列出文件已废弃，仅作为实现细节参考，此重构计划不再执行


# ChatSession/MessageManager/ToolCallManager 新职责与重构计划

## 一、ChatSession 新职责
- 只负责业务流程编排和消息快照管理（如多轮、上下文、会话切换），不再关心 UI 状态和流程状态（如 loading、error、cardStatus）。
- 只维护消息内容的快照（EnrichedMessage[]），所有流程/渲染状态通过 glue 层（如 middleware、taskLoop、UI props）传递。
- 负责调用 LLM 服务、工具链、消息流转等业务 glue，但不直接管理 Redux/store。
- 负责多会话管理（如 sessionMap、activeId），但不关心 UI 选中状态。
- 只暴露 getMessages/addMessage/updateLastMessage/clearMessages/save 等快照相关方法。
- 任务中断、流式事件、流程状态等全部通过 glue 层（如 middleware/taskLoop）处理。

### 修改计划
- 移除/废弃所有 UI 状态（如 isGenerating、error、cardStatus）相关字段和方法。
- 只保留消息快照管理和业务 glue 方法。
- 明确注释：ChatSession 只做快照和业务 glue，不做 UI 状态。
- 相关流程状态通过参数/回调传递给 glue 层，由 glue 层驱动 UI。

---

## 二、MessageManager 新职责
- 只负责消息的增删改查和快照持久化（如本地存储、数据库），不再管理任何流程/渲染状态。
- 所有消息类型统一为 EnrichedMessage，保证 id、timestamp 必填，彻底消除类型报错。
- 不再关心消息的流程状态（如 loading、error、tool_calling），这些状态由 glue 层/props 控制。
- 只暴露 getMessages/addMessage/updateLastMessage/clearMessages/filterForPersist/setSaveCallback 等快照相关方法。
- 不再直接与 Redux/store 交互，由 glue 层负责同步。

### 修改计划
- 检查所有方法，确保只处理消息内容快照，不处理流程/渲染状态。
- 工厂方法（createUserMessage/createAssistantMessage 等）只生成内容快照，流程状态通过 glue 层补充。
- 明确注释：MessageManager 只做快照管理，不做流程/渲染状态。
- 检查所有消息生成/派发点，确保补全 id、timestamp 字段。

---

## 三、ToolCallManager 新职责
- 只负责工具调用的业务 glue（如调用 MCP 服务、处理 tool call 结果），不再管理任何流程/渲染状态。
- 工具调用的状态流转（如 tool_calling、error、done）通过 glue 层（如 middleware/taskLoop）传递给 UI/store。
- 只暴露 handleToolCall/handleToolCalls 等业务 glue 方法，参数和回调全部解耦 UI 状态。
- 不再直接操作 Redux/store，只通过回调（如 addMessage、updateLastMessage）通知 glue 层。

### 修改计划
- 检查所有方法，确保只做工具调用 glue，不做流程/渲染状态管理。
- 所有状态变更通过回调参数传递，由 glue 层驱动 UI/store。
- 明确注释：ToolCallManager 只做工具调用 glue，不做流程/渲染状态。
- 检查所有工具调用相关消息，确保补全 id、timestamp 字段。

---

## 四、整体 glue 层/中间件/TaskLoop 协作说明
- Redux/store 只存消息快照（EnrichedMessage[]），所有流程/渲染状态通过 glue 层（如 cardStatus、isGenerating）传递给 UI。
- middleware/taskLoop 负责 glue 事件流（add/update/done/error/tool_call），驱动 Redux/store 和 UI 状态。
- UI 组件只读 props，所有流程状态由 glue 层控制。
- ChatSession/MessageManager/ToolCallManager 只做快照和业务 glue，不做 UI/流程状态。

---

## 五、后续建议
- 梳理并补全所有消息生成/派发点，确保 id、timestamp 字段完整。
- 检查所有 reducer/store/props 类型为 EnrichedMessage，彻底消除类型报错。
- 编写注释和文档，明确各层职责和协作方式，便于团队理解和维护。

如需具体代码修改建议或重构示例，可进一步细化到每个类/方法。
