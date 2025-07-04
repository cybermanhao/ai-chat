import { MCPService } from "./mcp-service.js";
import { loadConfig } from "./config.js";

/**
 * MCP 服务器主入口点
 */
async function main() {
  console.log("[DEBUG] MCP Server starting...");
  
  try {
    // 加载配置
    const config = loadConfig();
    console.log("[MCP Server] 配置加载完成");
    
    // 创建并启动 MCP 服务
    const mcpService = new MCPService(undefined, config);
    await mcpService.start();
    
    // 设置优雅关机处理
    setupGracefulShutdown(mcpService);
    
    // 保持进程运行
    keepProcessAlive();
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Failed to start server:`, error);
    process.exit(1);
  }
}

/**
 * 设置优雅关机处理
 */
function setupGracefulShutdown(mcpService: MCPService): void {
  const shutdown = async (signal: string) => {
    console.log(`[MCP Server] 收到 ${signal} 信号，正在优雅关机...`);
    try {
      await mcpService.stop();
      console.log("[MCP Server] 服务已优雅关闭");
      process.exit(0);
    } catch (error) {
      console.error("[MCP Server] 关闭服务时出错:", error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  
  // Windows 特定信号
  if (process.platform === 'win32') {
    process.on('SIGBREAK', () => shutdown('SIGBREAK'));
  }
}

/**
 * 保持进程运行
 */
function keepProcessAlive(): void {
  // 兼容 Windows/Node 18+，用 setInterval 替代空 Promise
  setInterval(() => {}, 1000);
}

// 启动服务器
main().catch(error => {
  console.error(`[${new Date().toISOString()}] Unhandled error:`, error);
  process.exit(1);
});
