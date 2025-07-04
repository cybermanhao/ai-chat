/**
 * MCP Server 配置选项
 */
export interface MCPServerConfig {
  /** 会话超时时间（毫秒），默认30分钟 */
  sessionTimeoutMs: number;
  
  /** 清理检查间隔（毫秒），默认5分钟 */
  cleanupIntervalMs: number;
  
  /** 状态报告间隔（毫秒），默认1分钟 */
  statusReportIntervalMs: number;
  
  /** 服务器端口 */
  port: number;
  
  /** 服务器主机地址 */
  host: string;
  
  /** MCP 端点路径 */
  mcpPath: string;
}

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: MCPServerConfig = {
  sessionTimeoutMs: 30 * 60 * 1000, // 30分钟
  cleanupIntervalMs: 5 * 60 * 1000,  // 5分钟
  statusReportIntervalMs: 60 * 1000,  // 1分钟
  port: 8000,
  host: "127.0.0.1",
  mcpPath: "/mcp"
};

/**
 * 从环境变量加载配置
 */
export function loadConfig(): MCPServerConfig {
  return {
    sessionTimeoutMs: parseInt(process.env.MCP_SESSION_TIMEOUT_MS || String(DEFAULT_CONFIG.sessionTimeoutMs)),
    cleanupIntervalMs: parseInt(process.env.MCP_CLEANUP_INTERVAL_MS || String(DEFAULT_CONFIG.cleanupIntervalMs)),
    statusReportIntervalMs: parseInt(process.env.MCP_STATUS_REPORT_INTERVAL_MS || String(DEFAULT_CONFIG.statusReportIntervalMs)),
    port: parseInt(process.env.MCP_PORT || String(DEFAULT_CONFIG.port)),
    host: process.env.MCP_HOST || DEFAULT_CONFIG.host,
    mcpPath: process.env.MCP_PATH || DEFAULT_CONFIG.mcpPath
  };
}
