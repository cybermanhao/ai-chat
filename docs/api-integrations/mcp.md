# MCP（Model Context Protocol）协议与 TypeScript SDK 中文指南

## 概述

Model Context Protocol（MCP，模型上下文协议）是一套为大模型应用提供上下文和工具能力的标准协议。它将“上下文提供”与“模型调用”解耦，允许你用统一的方式暴露数据、工具和交互模板，极大提升 LLM 应用的可扩展性和安全性。

本指南基于官方 TypeScript SDK，介绍如何快速构建 MCP Server/Client，如何注册资源、工具、Prompt，及常见场景代码示例。

---

## 快速入门

### 安装

```sh
npm install @modelcontextprotocol/sdk
```

### 创建一个简单的 MCP Server

```typescript
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "demo-server", version: "1.0.0" });

// 注册加法工具
server.registerTool("add",
  {
    title: "加法工具",
    description: "两个数字相加",
    inputSchema: { a: z.number(), b: z.number() }
  },
  async ({ a, b }) => ({ content: [{ type: "text", text: String(a + b) }] })
);

// 注册动态问候资源
server.registerResource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  { title: "问候资源", description: "动态问候语生成" },
  async (uri, { name }) => ({ contents: [{ uri: uri.href, text: `你好, ${name}!` }] })
);

// 启动 stdio 通信
const transport = new StdioServerTransport();
await server.connect(transport);
```

---

## 核心概念

### Server
McpServer 是协议的核心，负责连接管理、协议合规和消息路由。

### Resource（资源）
资源类似于 REST API 的 GET，用于暴露数据，不应有副作用。

```typescript
server.registerResource(
  "config",
  "config://app",
  { title: "应用配置", description: "应用配置信息", mimeType: "text/plain" },
  async (uri) => ({ contents: [{ uri: uri.href, text: "App 配置内容" }] })
);
```

支持动态参数、智能补全：

```typescript
server.registerResource(
  "user-profile",
  new ResourceTemplate("users://{userId}/profile", { list: undefined }),
  { title: "用户信息", description: "用户资料" },
  async (uri, { userId }) => ({ contents: [{ uri: uri.href, text: `用户 ${userId} 的资料` }] })
);
```

### Tool（工具）
工具类似 POST，允许 LLM 通过参数调用后端逻辑，可有副作用。

```typescript
server.registerTool(
  "calculate-bmi",
  { title: "BMI 计算器", description: "计算 BMI", inputSchema: { weightKg: z.number(), heightM: z.number() } },
  async ({ weightKg, heightM }) => ({ content: [{ type: "text", text: String(weightKg / (heightM * heightM)) }] })
);
```

### Prompt（交互模板）
Prompt 用于定义 LLM 交互模式，支持参数补全。

```typescript
import { completable } from "@modelcontextprotocol/sdk/server/completable.js";

server.registerPrompt(
  "review-code",
  { title: "代码审查", description: "审查代码", argsSchema: { code: z.string() } },
  ({ code }) => ({ messages: [{ role: "user", content: { type: "text", text: `请审查代码:\n\n${code}` } }] })
);
```

---

## 进阶用法

### 资源/参数智能补全
支持为资源模板参数、Prompt 参数提供动态补全建议。

### 工具返回 ResourceLink
工具可返回 ResourceLink 对象，供客户端按需读取大文件或引用资源。

### 会话管理与 HTTP 支持
支持 stdio、Streamable HTTP 等多种传输方式，支持有状态/无状态服务。

---

## 客户端用法

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({ command: "node", args: ["server.js"] });
const client = new Client({ name: "example-client", version: "1.0.0" });
await client.connect(transport);

// 调用工具
const result = await client.callTool({ name: "add", arguments: { a: 1, b: 2 } });
console.log(result);
```

---

## 面向客户端开发者的 MCP 集成实践

本节介绍如何开发一个可以与任意 MCP 服务器集成的 LLM 聊天机器人客户端。

### 环境准备

- Node.js 17+，npm 最新版
- 安装依赖：
  ```sh
  npm install @modelcontextprotocol/sdk @anthropic-ai/sdk dotenv
  npm install -D @types/node typescript
  ```
- 配置 .env 存储 API 密钥，并将 .env 加入 .gitignore

### 客户端核心流程

1. **初始化 MCP Client 并连接服务器**
   ```typescript
   import { Client } from "@modelcontextprotocol/sdk/client/index.js";
   import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
   const mcp = new Client({ name: "mcp-client", version: "1.0.0" });
   const transport = new StdioClientTransport({ command: "node", args: ["server.js"] });
   await mcp.connect(transport);
   ```
2. **获取工具列表**
   ```typescript
   const tools = await mcp.listTools();
   ```
3. **与 LLM（如 Claude）集成，自动处理工具调用**
   - 发送用户消息和工具描述给 LLM
   - LLM 决定是否调用工具
   - 客户端自动调用工具并将结果反馈给 LLM
   - LLM 生成最终回复
4. **交互式聊天循环**
   - 支持多轮对话和多次工具调用

### 故障排查与建议

- 路径、API Key、依赖、响应慢等常见问题
- 建议将所有工具调用和 LLM 响应处理包裹在 try-catch 中
- 保证 .env 不被提交到 git

更多详细代码和最佳实践请参考本项目的 tests 目录和官方 SDK 文档。

---

## 参考资料
- [MCP 官方文档](https://modelcontextprotocol.org/)
- [TypeScript SDK 仓库](https://github.com/modelcontextprotocol/sdk)
- [OpenAI Function Calling 兼容](https://platform.openai.com/docs/guides/function-calling)

如需更详细的例子和进阶用法，请参考 SDK 官方文档和本项目的 tests 目录。
