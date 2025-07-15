import { MCPService } from './mcp-service';
import { loadConfig, MCPServerConfig } from './config';
import fs from 'fs';
import path from 'path';

// 自动收集工具，支持 defineTool 和 schema+handler 分离
export function collectAllTools(): any[] {
  const tools: any[] = [];
  const toolsDir = path.join(__dirname, 'tools');
  if (fs.existsSync(toolsDir)) {
    const toolFiles = fs.readdirSync(toolsDir).filter(f => f.endsWith('.js'));
    for (const file of toolFiles) {
      const mod = require(path.join(toolsDir, file));
      for (const exp of Object.values(mod)) {
        if (exp && typeof exp === 'object' && 'name' in exp && 'handler' in exp) {
          tools.push(exp);
        } else if (exp && typeof exp === 'object' && 'schema' in exp && 'handler' in exp) {
          const schema = exp.schema as any;
          tools.push({
            name: schema.name,
            description: schema.description,
            inputSchema: schema.inputSchema,
            handler: exp.handler,
            annotations: schema.annotations,
          });
        }
      }
    }
  }
  return tools;
}

// 主入口，自动收集工具并启动 MCPService
export async function startMcpServer(config?: Partial<MCPServerConfig>) {
  const finalConfig = { ...loadConfig(), ...config };
  finalConfig.tools = collectAllTools();
  finalConfig.tools.forEach(t => {
    console.log(`[MCPServer] 注册工具: ${t.name}`);
  });
  const mcpService = new MCPService(undefined, finalConfig);
  await mcpService.start();
  return mcpService;
}

// CLI入口
if (require.main === module) {
  startMcpServer().then(() => {
    console.log('[MCPServer] 服务已启动');
  }).catch(err => {
    console.error('[MCPServer] 启动失败:', err);
    process.exit(1);
  });
}
