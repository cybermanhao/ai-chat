// SSC Server - MCP 路由
import { Router, Request, Response } from 'express';
import { mcpProxy } from '../services/mcpProxy';

const router: Router = Router();

// MCP 工具调用接口
router.post('/call-tool', async (req: Request, res: Response) => {
  try {
    const { serverId, toolName, args, callId } = req.body;

    if (!toolName) {
      return res.status(400).json({ error: '缺少 toolName 参数' });
    }

    console.log(`[MCP Route] 收到工具调用请求: ${toolName}`);

    const result = await mcpProxy.callTool(serverId || 'default', toolName, args || {}, callId);

    // 返回结果
    res.json({
      serverId: serverId || 'default',
      toolName,
      args,
      callId,
      data: result.data,
      error: result.error,
    });

  } catch (error) {
    console.error('[MCP Route] 工具调用出错:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : '工具调用失败',
    });
  }
});

// 获取可用工具列表
router.get('/tools', async (req: Request, res: Response) => {
  try {
    console.log(`[MCP Route] 收到获取工具列表请求`);

    const tools = await mcpProxy.listTools();

    res.json({
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description || `调用 ${tool.name} 工具`,
        inputSchema: tool.inputSchema || {
          type: 'object',
          properties: {},
        },
      })),
    });

  } catch (error) {
    console.error('[MCP Route] 获取工具列表出错:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : '获取工具列表失败',
    });
  }
});

// MCP 服务器健康检查
router.get('/health', async (req: Request, res: Response) => {
  try {
    const healthy = await mcpProxy.checkHealth();
    const serverInfo = await mcpProxy.getServerInfo();

    res.json({
      healthy,
      ...serverInfo,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[MCP Route] 健康检查出错:', error);
    res.status(500).json({
      healthy: false,
      error: error instanceof Error ? error.message : '健康检查失败',
      timestamp: new Date().toISOString(),
    });
  }
});

// 获取MCP服务器状态
router.get('/status', async (req: Request, res: Response) => {
  try {
    const serverInfo = await mcpProxy.getServerInfo();
    const tools = await mcpProxy.listTools();

    res.json({
      server: serverInfo,
      toolsCount: tools.length,
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
      })),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[MCP Route] 获取状态出错:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : '获取状态失败',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;