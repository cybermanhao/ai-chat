import { MCPService } from "./mcp-service";
import { MCPServerConfig } from "./config";
import type { MCPServerInfo } from "./mcp-server-manager";

export async function createMcpServer(config: Partial<MCPServerConfig> & { serverInfo?: MCPServerInfo }) {
  if (!config.tools || !Array.isArray(config.tools)) {
    throw new Error("请传入 tools 数组");
  }
  // 自动填充必需项，保证类型安全
  const defaultConfig: MCPServerConfig = {
    port: config.port ?? 8000,
    sessionTimeoutMs: config.sessionTimeoutMs ?? 60000,
    cleanupIntervalMs: config.cleanupIntervalMs ?? 60000,
    statusReportIntervalMs: config.statusReportIntervalMs ?? 60000,
    host: config.host ?? "127.0.0.1",
    mcpPath: config.mcpPath ?? "/mcp",
    tools: config.tools,
    // 可补充其他默认项
  };
  const mcpService = new MCPService(config.serverInfo, defaultConfig, config.tools);
  await mcpService.start();
  return mcpService;
}

// defineTool 工厂函数实现
export function defineTool({
  name,
  description,
  inputSchema,
  handler,
  annotations,
}: {
  name: string;
  description: string;
  inputSchema: any;
  handler: Function;
  annotations?: any;
}) {
  return { name, description, inputSchema, handler, annotations };
}
