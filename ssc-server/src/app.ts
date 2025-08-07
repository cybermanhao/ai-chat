// SSC Server - 主应用入口
import express from 'express';
import cors from 'cors';
import { serverConfig, validateConfig } from './config';
import llmRoutes from './routes/llm';
import mcpRoutes from './routes/mcp';

// 验证配置
validateConfig();

const app: express.Application = express();

// 中间件
app.use(cors({
  origin: serverConfig.allowedOrigins,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// 路由
app.use('/api/llm', llmRoutes);
app.use('/api/mcp', mcpRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'TaskLoop SSC Server',
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

// 获取服务器信息
app.get('/info', (req, res) => {
  res.json({
    service: 'TaskLoop SSC Server',
    version: '1.0.0',
    nodeVersion: process.version,
    platform: process.platform,
    environment: serverConfig.nodeEnv,
    endpoints: {
      llm: [
        'POST /api/llm/chat - LLM聊天 (SSE)',
        'POST /api/llm/abort - 中断LLM请求',
        'GET /api/llm/models - 获取可用模型',
      ],
      mcp: [
        'POST /api/mcp/call-tool - 调用MCP工具',
        'GET /api/mcp/tools - 获取可用工具',
        'GET /api/mcp/health - MCP服务器健康检查',
        'GET /api/mcp/status - MCP服务器状态',
      ],
      system: [
        'GET /health - 系统健康检查',
        'GET /info - 系统信息',
      ],
    },
    timestamp: new Date().toISOString(),
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `路径 ${req.originalUrl} 不存在`,
    availableEndpoints: [
      'GET /health',
      'GET /info',
      'POST /api/llm/chat',
      'POST /api/llm/abort',
      'GET /api/llm/models',
      'POST /api/mcp/call-tool',
      'GET /api/mcp/tools',
      'GET /api/mcp/health',
    ],
  });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[App] 服务器错误:', err);
  
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: serverConfig.nodeEnv === 'development' ? err.message : '内部服务器错误',
    timestamp: new Date().toISOString(),
  });
});

// 启动服务器
const server = app.listen(serverConfig.port, () => {
  console.log('');
  console.log('🚀 TaskLoop SSC Server 启动成功!');
  console.log(`📍 地址: http://localhost:${serverConfig.port}`);
  console.log(`🌍 环境: ${serverConfig.nodeEnv}`);
  console.log('');
  console.log('📚 可用接口:');
  console.log(`  GET  http://localhost:${serverConfig.port}/health`);
  console.log(`  GET  http://localhost:${serverConfig.port}/info`);
  console.log(`  POST http://localhost:${serverConfig.port}/api/llm/chat`);
  console.log(`  POST http://localhost:${serverConfig.port}/api/mcp/call-tool`);
  console.log('');
  console.log('🔧 测试命令:');
  console.log(`  curl http://localhost:${serverConfig.port}/health`);
  console.log(`  curl http://localhost:${serverConfig.port}/api/llm/models`);
  console.log(`  curl http://localhost:${serverConfig.port}/api/mcp/tools`);
  console.log('');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('\n🛑 收到 SIGTERM 信号，开始优雅关闭...');
  server.close(() => {
    console.log('✅ SSC Server 已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 收到 SIGINT 信号，开始优雅关闭...');
  server.close(() => {
    console.log('✅ SSC Server 已关闭');
    process.exit(0);
  });
});

export default app;