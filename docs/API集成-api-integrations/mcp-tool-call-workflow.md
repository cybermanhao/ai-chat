# MCP 工具调用全流程开发文档

## 1. 触发入口：对话中使用 MCP 工具
- 用户在对话框输入内容，前端将消息、可用工具等信息通过 `buildLLMRequestPayload` 拼接后发送给大模型（如 DeepSeek/OpenAI）。
- 请求体中 tools 字段由 MCP server 动态提供，支持开关和参数兜底。

## 2. 大模型返回 tool_call 响应
- 大模型检测到需要调用工具时，返回 `tool_use` 类型响应，内容包含：
  - `name`: 工具名称
  - `input`/`arguments`: 工具参数（需符合 schema）

## 3. 客户端解析 tool_call 并发起 MCP 工具调用
- 客户端监听大模型响应，发现 `tool_use` 类型时：
  - 提取工具名和参数
  - 调用 MCP SDK 的 `callTool` 方法：
    ```ts
    const result = await mcp.callTool({ name: toolName, arguments: toolArgs });
    ```
- SDK 自动校验工具是否注册、参数是否合法，并通过传输层与 MCP server 通信。

## 4. 渲染 MCP 工具调用过程组件
- 在对话流中插入 MCP 工具调用的过程组件（如 loading、参数、结果、错误等 UI）。
- 支持实时展示调用进度、参数、返回内容。

## 5. 工具调用结果返回客户端
- MCP server 返回标准化结果（content/metadata），SDK 解析后返回给前端。
- 前端将结果以消息形式插入对话流，供用户和大模型后续处理。

## 6. 客户端将结果返回大模型
- 客户端将工具调用结果作为新消息，继续发送给大模型：
  ```ts
  messages.push({ role: 'user', content: result.content });
  ```
- 大模型继续生成后续回复，实现“工具-大模型-用户”多轮交互。

## 7. 错误处理与调试
- 工具调用失败时，前端可将错误信息插入对话流，并返回给大模型。
- 支持打印原始通信、参数校验、超时等调试手段。

---

## 关键代码参考

### 1. 发送 LLM 请求
```ts
const payload = buildLLMRequestPayload(messages, { server, extraOptions });
const stream = await llmService.generate(payload, abortSignal);
```

### 2. 解析 tool_call 并调用 MCP
```ts
if (content.type === 'tool_use') {
  const toolName = content.name;
  const toolArgs = content.input;
  const result = await mcp.callTool({ name: toolName, arguments: toolArgs });
}
```

### 3. 渲染 MCP 调用过程
- 在对话流插入 loading/结果/错误等组件。

### 4. 结果返回大模型
```ts
messages.push({ role: 'user', content: result.content });
```

---

## 总结
- 工具调用流程分层清晰，参数兜底集中在请求体拼接。
- SDK 屏蔽协议细节，开发者只需关注对话流和工具调用入口。
- UI 可灵活渲染 MCP 调用过程，提升用户体验。

<!-- 新增：2025-06-24 MCP工具调用通用状态流转与前端集成实践 -->

## MCP工具调用通用状态流转与前端集成实践（2025-06-24）

### 1. engine 层通用方法封装
- 在 `engine/service/mcpService.ts` 增加 `callToolWithStatus` 方法，实现 MCP 工具调用的 loading/done/error 状态流转和回调。
- 该方法用于前端统一处理工具调用的 UI 响应，便于 web 层直接复用。
- 方法签名：
  ```ts
  export async function callToolWithStatus({
    mcp,
    name,
    args = {},
    onStatusChange,
  }: {
    mcp: MCPService;
    name: string;
    args?: Record<string, any>;
    onStatusChange: (status: 'loading' | 'done' | 'error', payload: any) => void;
  })
  ```
- 典型用法：
  - `onStatusChange('loading', { name, args })` → UI 插入 loading 消消息
  - `onStatusChange('done', { name, args, result })` → UI 展示结果
  - `onStatusChange('error', { name, args, error })` → UI 展示错误

### 2. web 层 re-export
- 在 `web/src/services/mcpService.ts` re-export 了 `callToolWithStatus`，web 现在可直接 import 使用。
- 这样 web 只需 `import { callToolWithStatus } from '@/services/mcpService'` 即可。

### 3. 参考文档与最佳实践
- 该方法与本文件第3、4、5节流程完全兼容，支持对话流插入 loading/结果/错误等组件。
- 推荐在解析 tool_call 后直接调用 callToolWithStatus，实现 UI 响应和多轮交互。
- 相关代码与架构建议详见：
  - [MCP工具调用全流程开发文档](./mcp-tool-call-workflow.md)
  - [MCP协议与TypeScriptSDK指南](./mcp.md)

---
