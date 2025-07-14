// mcp-remote: 极简 MCP Server 工具注册与分发库
import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";

export interface ToolSchema {
  name: string;
  description: string;
  inputSchema: object;
  handler: (args: any) => Promise<any>;
  annotations?: object;
}

export function defineTool(tool: ToolSchema): ToolSchema {
  return tool;
}

export function createMcpServer({ tools, port = 8000 }: { tools: ToolSchema[]; port?: number }) {
  const toolMap: Record<string, ToolSchema> = Object.fromEntries(tools.map((t) => [t.name, t]));

  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req: Request, res: Response) => {
    const { method, params } = req.body || {};
    if (method === "tools/list") {
      res.json({
        tools: tools.map(({ name, description, inputSchema, annotations }) => ({
          name, description, inputSchema, annotations
        }))
      });
      return;
    }
    if (method === "tools/call") {
      const { name, arguments: args } = params || {};
      const tool = toolMap[name];
      if (!tool) {
        res.status(400).json({ error: "Tool not found" });
        return;
      }
      try {
        const result = await tool.handler(args);
        res.json(result);
      } catch (e) {
        res.json({ isError: true, content: [{ type: "text", text: String(e) }] });
      }
      return;
    }
    res.status(400).json({ error: "Unknown method" });
  });

  app.listen(port, () => {
    console.log(`MCP Server running on port ${port}`);
  });
}

// 自动收集工具（支持 defineTool 和 schema+handler 分离两种方式）
export function collectToolsFromModule(mod: any): ToolSchema[] {
  const tools: ToolSchema[] = [];
  for (const exp of Object.values(mod)) {
    // defineTool 方式
    if (exp && typeof exp === "object" && "name" in exp && "handler" in exp) {
      tools.push(exp as ToolSchema);
    }
    // 传统 schema+handler 分离方式
    if (
      exp &&
      typeof exp === "object" &&
      "schema" in exp &&
      "handler" in exp &&
      typeof (exp as any).schema === "object" &&
      typeof (exp as any).handler === "function"
    ) {
      const schema = (exp as any).schema;
      const handler = (exp as any).handler;
      tools.push({
        name: schema.name,
        description: schema.description,
        inputSchema: schema.inputSchema,
        handler,
        annotations: schema.annotations,
      });
    }
  }
  return tools;
}

// --- CLI/主入口模式 ---
if (require.main === module) {
  const toolsDir = path.join(__dirname, "tools");
  let toolList: ToolSchema[] = [];
  if (fs.existsSync(toolsDir)) {
    const toolFiles = fs.readdirSync(toolsDir).filter(f => f.endsWith(".js"));
    for (const file of toolFiles) {
      const mod = require(path.join(toolsDir, file));
      toolList.push(...collectToolsFromModule(mod));
    }
  }
  if (toolList.length === 0) {
    console.warn("[mcp-remote] 未发现任何工具，未启动 server。");
  } else {
    createMcpServer({ tools: toolList, port: process.env.PORT ? Number(process.env.PORT) : 8000 });
  }
}
