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
