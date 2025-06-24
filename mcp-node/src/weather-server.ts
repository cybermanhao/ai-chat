import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "crypto";
import { z } from "zod";

const server = new McpServer({
  name: "weather",
  version: "1.0.0",
});

// 注册 hello 工具
server.tool(
  "hello",
  "Say hello to someone",
  { name: z.string().describe("Name to greet") },
  async ({ name }) => ({
    content: [{ type: "text", text: `Hello, ${name}!` }],
  })
);

// 注册 add 工具
server.tool(
  "add",
  "Add two numbers",
  {
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: `Result: ${a + b}` }],
  })
);

// Express + MCP Streamable HTTP integration
async function main() {
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
  // 移除 CORS 相关 header 设置
  const MCP_PATH = "/mcp-weather";
  const PORT = process.env.PORT ? Number(process.env.PORT) : 8010;
  const HOST = process.env.HOST || "127.0.0.1";

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });
  await server.connect(transport);

  app.post(MCP_PATH, async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] POST ${MCP_PATH}`);
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    await transport.handleRequest(req, res, req.body);
    console.log(`[${new Date().toISOString()}] POST ${MCP_PATH} 响应已发送`);
  });
  app.get(MCP_PATH, async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] GET ${MCP_PATH}`);
    console.log('Headers:', req.headers);
    console.log('Query:', req.query);
    await transport.handleRequest(req, res);
    console.log(`[${new Date().toISOString()}] GET ${MCP_PATH} 响应已发送`);
  });

  app.listen(PORT, HOST, () => {
    console.log(`Weather MCP Server running on http://${HOST}:${PORT}${MCP_PATH}`);
  });
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
