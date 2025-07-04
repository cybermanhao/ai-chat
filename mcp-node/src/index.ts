/**
 * MCP Server 模块导出
 */

// 核心服务导出
export { SessionManager } from "./session-manager.js";
export { MCPServerManager } from "./mcp-server-manager.js";
export { MCPFunctionRegistry } from "./registry.js";

// 配置导出
export { loadConfig, DEFAULT_CONFIG } from "./config.js";
export type { MCPServerConfig } from "./config.js";

// 工具、资源、提示词导出
export * from "./tools/index.js";
export * from "./resources/index.js";
export * from "./prompts/index.js";

// 类型导出
export type { MCPServerInfo } from "./mcp-server-manager.js";
export type { SessionData } from "./session-manager.js";

// 兼容性导出 (保持向后兼容)
export { MCPService } from "./mcp-service.js";
export { HTTPServer } from "./http-server.js";

// 主入口点
export { MCPService as default } from "./mcp-service.js";
