import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// 创建 MCP Server 实例
type ServerInfo = {
  name: string;
  version: string;
  description: string;
};

const mcpServer = new McpServer({
  name: "node-mcp-server",
  version: "1.0.0",
  description: "Node 版 MCP Server 示例 (TypeScript)"
} as ServerInfo);

// greeting 资源
function greetingHandler(_uri: URL, variables: { [key: string]: string | string[] }, _extra: any) {
  return Promise.resolve({
    contents: [{ uri: `greeting://${variables.name}`, text: `Hello, ${variables.name}!` }]
  });
}

mcpServer.registerResource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  {
    title: "greeting",
    description: "用于演示的一个资源协议"
  },
  greetingHandler
);

// translate prompt
mcpServer.registerPrompt(
  "translate",
  {
    title: "translate",
    description: "进行翻译的prompt",
    argsSchema: { message: z.string() }
  },
  async ({ message }: { message: string }) => ({
    messages: [
      {
        role: "user",
        content: { type: "text", text: `请将下面的话语翻译成中文：\n\n${message}` }
      }
    ]
  })
);

// test 工具
mcpServer.registerTool(
  "test",
  {
    title: "test",
    description: "用来测试",
    inputSchema: {
      params: z.object({ start: z.string(), end: z.string() }),
      test1: z.string(),
      test2: z.union([z.string(), z.array(z.string())]).optional(),
      test3: z.string().optional()
    }
  },
  async ({ params, test1, test2, test3 }: {
    params: { start: string; end: string };
    test1: string;
    test2?: string | string[];
    test3?: string;
  }) => ({
    content: [
      { type: "text", text: JSON.stringify([test1, test2, test3, params]) }
    ]
  })
);

// weather 工具
mcpServer.registerTool(
  "weather",
  {
    title: "weather",
    description: "根据城市天气预报的城市编码 (int)，获取指定城市的天气信息",
    inputSchema: { city_code: z.number() }
  },
  async ({ city_code }: { city_code: number }) => {
    return {
      content: [
        { type: "text", text: `城市编码 ${city_code} 的天气信息：晴，25℃` }
      ]
    };
  }
);

// 启动 Streamable HTTP 服务
async function start() {
  console.log("[DEBUG] MCP Server start() called");
  let StreamableHTTPServerTransport: any;
  try {
    ({ StreamableHTTPServerTransport } = await import("@modelcontextprotocol/sdk/server/streamableHttp.js"));
  } catch (e) {
    const mod = await import("@modelcontextprotocol/sdk/server/streamableHttp.js");
    StreamableHTTPServerTransport = mod.StreamableHTTPServerTransport;
  }
  const transport = new StreamableHTTPServerTransport({
    port: 8000,
    host: "127.0.0.1", // 强制监听 IPv4，便于排查
    path: "/mcp",
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
      allowedHeaders: [
        "Content-Type", 
        "Authorization", 
        "mcp-protocol-version", 
        "mcp-session-id",
        "Accept",
        "Origin"
      ],
      exposedHeaders: [
        "mcp-protocol-version",
        "mcp-session-id"
      ],
      credentials: true
    }
  });
  console.log("[DEBUG] Before mcpServer.connect");
  await mcpServer.connect(transport);
  console.log(`[${new Date().toISOString()}] MCP Server is running on http://localhost:8000/mcp`);
  await new Promise(() => {}); // 防止进程自动退出，保持服务常驻
}

start().catch(err => {
  console.error(`[${new Date().toISOString()}] Failed to start server:`, err);
  process.exit(1);
});
