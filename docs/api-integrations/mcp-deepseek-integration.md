# MCP + Deepseek API 实战集成指南

本指南聚焦于如何将 MCP（Model Context Protocol）协议能力与 Deepseek API（dsapi）集成，实现统一的 LLM 工具调用、上下文注入与多模型协作。适用于希望用 MCP 生态扩展 Deepseek 能力的开发者。

---

## 场景说明
- 你有一套 MCP Server/Client 能力（如工具、资源、Prompt），希望让 Deepseek API 也能用这些能力。
- 你想让 Deepseek function calling 自动转发到 MCP 工具，或让 MCP 作为 Deepseek 的“工具后端”。

## 架构与流程

```
用户输入 → MCP Client → Deepseek API（带 tools）→ [模型判断是否调用工具] → MCP Client 自动 callTool → 工具结果回传 Deepseek → Deepseek 生成最终回复
```

## 依赖与环境

- Node.js 17+
- @modelcontextprotocol/sdk
- Deepseek API Key
- 推荐配合 dotenv 管理密钥

## 关键代码结构

### 1. MCP Client 初始化与工具同步
```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const mcp = new Client({ name: "mcp-dsapi-client", version: "1.0.0" });
const transport = new StdioClientTransport({ command: "node", args: ["server.js"] });
await mcp.connect(transport);
const tools = await mcp.listTools(); // 获取 MCP Server 注册的所有工具
```

### 2. Deepseek API 请求封装
```typescript
const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: userInput }],
    stream: true,
    tools, // 直接传 MCP 工具描述
    tool_choice: 'auto',
    ...其它参数
  })
});
```

### 3. 工具调用自动转发
```typescript
for await (const chunk of streamResponse(response)) {
  if (chunk.tool_content) {
    // 解析 tool_name 和参数
    const { name, arguments: toolArgs } = chunk.tool_content;
    // 自动转发到 MCP
    const result = await mcp.callTool({ name, arguments: toolArgs });
    // 将结果反馈给 Deepseek（如需多轮，可拼接到 messages 再发起新请求）
  }
  // 其它内容处理
}
```

### 4. 多轮对话与上下文注入
- 可将 MCP 资源内容注入到 Deepseek messages 或 system prompt
- 支持多次工具调用与多轮流式响应

## 进阶用法
- 支持多端 MCP Server（如 Python/Node）
- 工具参数自动 JSON Schema 映射
- Deepseek function calling 与 MCP Tool 完全兼容
- 错误处理与超时重试

## 常见问题
- 工具参数类型不匹配：确保 MCP 工具参数 schema 与 Deepseek tools 一致
- 工具调用超时：建议设置合理超时与重试机制
- 多轮对话上下文丢失：每轮都需维护完整 messages

## 参考资料
- [Deepseek API 官方文档](https://api-docs.deepseek.com/zh-cn/api/create-chat-completion)
- [MCP 官方文档](https://modelcontextprotocol.org/)
- [TypeScript MCP Client 示例](../examples/quickstart-resources/mcp-client-typescript/index.ts)

---

如需完整代码示例，请参考本项目 examples/quickstart-resources/mcp-client-typescript 目录。
