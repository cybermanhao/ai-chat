# Electron task-loop IPC 通信事件设计

## 目标
- 让 task-loop 在 Electron 渲染进程下，所有 LLM/MCP 相关操作通过 IPC 事件与主进程通信，主进程代理实际业务。
- 支持流式事件、工具调用、任务中断等全流程。

## 事件设计

### 1. LLM 相关
- `llm-chat`：发起 LLM 聊天/补全请求
  - 参数：{ chatId, messages, config, ... }
  - 返回：流式/完整 LLM 响应
- `llm-abort`：中断当前 LLM 任务
  - 参数：{ chatId }
  - 返回：确认/状态

### 2. MCP 相关
- `mcp-listTools`：获取工具列表
  - 参数：无
  - 返回：{ data: Tool[], error? }
- `mcp-callTool`：调用指定工具
  - 参数：{ name, args }
  - 返回：{ data, error? }

### 3. 任务流/事件流
- `taskloop-event`（可选，主进程向渲染进程推送流式事件）
  - 参数：{ chatId, eventType, payload }
  - 用于流式 token、工具调用、done/error 等事件推送
  - 需配合 contextBridge/exposeInMainWorld 订阅

### 4. 其他
- `llm-getStatus`：查询 LLM 任务状态
- `mcp-getStatus`：查询 MCP 连接/任务状态

## 典型调用流程
1. 渲染进程 task-loop 调用 llmService/mcpService glue，检测到 Electron 环境，发起 IPC 事件（如 `llm-chat`、`mcp-callTool`）。
2. 主进程收到事件，调用本地 Node 逻辑，处理后返回结果。
3. 如需流式事件，主进程通过 `taskloop-event` 主动推送，渲染进程订阅并 glue 到 Redux/业务层。
4. 任务中断、状态查询等同理。

## 事件与参数一览
| 事件名         | 方向         | 说明             | 参数/返回结构 |
|----------------|--------------|------------------|--------------|
| llm-chat       | 渲染→主进程  | 发起 LLM 聊天    | { chatId, ... } → LLM 响应 |
| llm-abort      | 渲染→主进程  | 中断 LLM 任务    | { chatId } → 状态 |
| mcp-listTools  | 渲染→主进程  | 获取工具列表     | 无 → { data, error? } |
| mcp-callTool   | 渲染→主进程  | 调用工具         | { name, args } → { data, error? } |
| taskloop-event | 主进程→渲染  | 推送流式事件     | { chatId, eventType, payload } |

## 里程碑
- [ ] 渲染进程 glue 层支持所有 IPC 事件
- [ ] 主进程注册 handler 并代理业务
- [ ] 支持流式事件推送与订阅
- [ ] 联调测试与文档完善
