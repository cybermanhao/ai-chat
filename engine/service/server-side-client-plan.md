# MCP/LLM Server-Side-Client 代理模式设计方案

## 1. 背景与目标

- 支持前端可选直连 LLM/MCPServer 或通过本地 Node 服务端代理（server-side-client）转发所有请求。
- 兼容原有客户端直连逻辑，便于前后端灵活切换。
- 便于本地安全、内网穿透、统一鉴权、流量管控等场景。

## 2. 架构概览

```
[前端] <——(可选直连/代理)——> [Node服务端代理] <——> [LLM/MCPServer]
```
- 前端可通过配置选择：
  - 直连 LLM/MCPServer（如 SSE/HTTP）
  - 通过本地 Node 服务端（Express/Koa/Fastify 等）转发
- 服务端代理负责：
  - 维护与 LLM/MCPServer 的连接池/会话
  - 统一转发、鉴权、日志、限流
  - 支持多实例并发

## 3. 服务端代理 API 设计

### 3.1 路由示例

- `/api/llm/chat`：转发 LLM 聊天请求
- `/api/mcp/tool`：转发 MCP 工具调用
- `/api/mcp/listTools`：获取工具列表
- `/api/llm/stream`：流式转发 LLM 响应

### 3.2 Express 伪代码示例

```ts
import express from 'express';
import { MCPService } from './mcpService';
import { streamLLMChat } from './llmService';

const app = express();
app.use(express.json());

// LLM 聊天转发
app.post('/api/llm/chat', async (req, res) => {
  const { messages, ...config } = req.body;
  try {
    const result = await streamLLMChat({ ...config, messages });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// MCP 工具调用转发
app.post('/api/mcp/tool', async (req, res) => {
  const { name, args, mcpConfig } = req.body;
  const mcp = new MCPService(mcpConfig.url, mcpConfig.connectionType);
  try {
    await mcp.connect();
    const result = await mcp.callTool(name, args);
    await mcp.disconnect();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// 工具列表
app.get('/api/mcp/listTools', async (req, res) => {
  const mcp = new MCPService(/* ... */);
  try {
    await mcp.connect();
    const result = await mcp.listTools();
    await mcp.disconnect();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(3001, () => {
  console.log('Server-side-client proxy listening on 3001');
});
```

## 4. 前端适配建议

- 通过配置项选择直连或代理：
  - 直连：直接请求 LLM/MCPServer
  - 代理：请求 `/api/llm/chat`、`/api/mcp/tool` 等本地服务
- 可通过工厂函数/环境变量切换两种模式

## 5. 并发与资源隔离

- 每个请求 new 独立 MCPService/LLM 客户端，天然支持多实例并发
- 可扩展连接池、限流、队列等机制

## 6. 典型应用场景

- 桌面端/本地部署，前端无法直连 LLM/MCPServer
- 需要统一鉴权、日志、限流、内网穿透等

## 7. 后续优化建议

- 支持 WebSocket/Server-Sent Events 流式转发
- 增加 API 鉴权、限流、监控
- 支持多用户会话隔离
- 兼容更多 LLM/MCPServer 类型

---
如需更详细代码模板或具体业务 glue 示例，可随时补充需求。
