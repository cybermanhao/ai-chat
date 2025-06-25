import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import express, { Request, Response } from "express";

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
mcpServer.registerResource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  {
    title: "greeting",
    description: "用于演示的一个资源协议"
  },
  async function greetingHandler(_uri: URL, variables: { [key: string]: string | string[] }, _extra: any) {
    console.log(`[MCPServer] greeting resource called, variables:`, variables);
    const result = {
      contents: [{ uri: `greeting://${variables.name}`, text: `Hello, ${variables.name}!` }]
    };
    console.log(`[MCPServer] greeting resource result:`, result);
    return result;
  }
);

// translate prompt
mcpServer.registerPrompt(
  "translate",
  {
    title: "translate",
    description: "进行翻译的prompt",
    argsSchema: { message: z.string() }
  },
  async ({ message }: { message: string }) => {
    console.log(`[MCPServer] translate prompt called, message:`, message);
    const result = {
      messages: [
        {
          role: "user" as const,
          content: { type: "text" as const, text: `请将下面的话语翻译成中文：\n\n${message}` }
        }
      ]
    };
    console.log(`[MCPServer] translate prompt result:`, result);
    return result;
  }
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
  }) => {
    console.log(`[MCPServer] test tool called, params:`, { params, test1, test2, test3 });
    const result = {
      content: [
        { type: "text" as const, text: JSON.stringify([test1, test2, test3, params]) }
      ]
    };
    console.log(`[MCPServer] test tool result:`, result);
    return result;
  }
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
    console.log(`[MCPServer] weather tool called, city_code:`, city_code);
    const result = {
      content: [
        { type: "text" as const, text: `城市编码 ${city_code} 的天气信息：晴，25℃` }
      ]
    };
    console.log(`[MCPServer] weather tool result:`, result);
    return result;
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
    sessionIdGenerator: () => Date.now().toString(),
  });
  await mcpServer.connect(transport);

  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, mcp-protocol-version, mcp-session-id, Accept, Origin");
    res.header("Access-Control-Expose-Headers", "mcp-protocol-version, mcp-session-id");
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  const MCP_PATH = "/mcp";
  const PORT = 8000;
  const HOST = "127.0.0.1";

  app.post(MCP_PATH, async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] POST ${MCP_PATH}`);
    await transport.handleRequest(req, res, req.body);
    console.log(`[${new Date().toISOString()}] POST ${MCP_PATH} 响应已发送`);
  });
  app.get(MCP_PATH, async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] GET ${MCP_PATH}`);
    await transport.handleRequest(req, res);
    console.log(`[${new Date().toISOString()}] GET ${MCP_PATH} 响应已发送`);
  });

  app.listen(PORT, HOST, () => {
    console.log(`MCP Server running on http://${HOST}:${PORT}${MCP_PATH}`);
  });

  // 阻止进程退出，兼容 Windows/Node 18+，用 setInterval 替代空 Promise
  setInterval(() => {}, 1000);
}

start().catch(err => {
  console.error(`[${new Date().toISOString()}] Failed to start server:`, err);
  process.exit(1);
});
