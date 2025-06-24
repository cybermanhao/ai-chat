import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "crypto";
import { z } from "zod";

const server = new McpServer({
  name: "example",
  version: "1.0.0",
});

// 注册 echo 工具
server.tool(
  "echo",
  "Echo input text",
  { text: z.string().describe("Text to echo") },
  async ({ text }) => ({
    content: [{ type: "text", text: `Echo: ${text}` }],
  })
);

// 注册 multiply 工具
server.tool(
  "multiply",
  "Multiply two numbers",
  {
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: `Result: ${a * b}` }],
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
  const MCP_PATH = "/mcp-example";
  const PORT = process.env.PORT ? Number(process.env.PORT) : 8020;
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
    console.log(`Example MCP Server running on http://${HOST}:${PORT}${MCP_PATH}`);
  });
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
