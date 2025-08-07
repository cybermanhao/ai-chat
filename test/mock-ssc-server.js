#!/usr/bin/env node

/**
 * Mock SSC Server for TaskLoop SDK Testing
 * 模拟SSC后端服务器，用于测试TaskLoop SDK
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8080;

// 中间件
app.use(cors());
app.use(express.json());

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// LLM Chat API (SSE)
app.post('/api/llm/chat', (req, res) => {
  console.log('LLM Chat 请求:', req.body);
  
  const { chatId, messages, model, temperature, tools } = req.body;
  
  // 设置SSE响应头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  });

  // 模拟响应序列
  let step = 0;
  const responses = [
    { type: 'status', status: 'connecting' },
    { type: 'status', status: 'thinking' },
    { type: 'chunk', role: 'assistant', content: '您好！', phase: 'generating' },
    { type: 'status', status: 'generating' },
    { type: 'chunk', role: 'assistant', content: '您好！我来帮您', phase: 'generating' },
  ];

  // 检查是否需要工具调用
  const userMessage = messages[messages.length - 1];
  const needsToolCall = userMessage && (
    userMessage.content.includes('客户列表') ||
    userMessage.content.includes('查询') ||
    userMessage.content.includes('工具')
  );

  if (needsToolCall) {
    // 添加工具调用响应
    responses.push(
      { type: 'status', status: 'tool_calling' },
      { 
        type: 'chunk', 
        role: 'assistant', 
        content: '', 
        tool_calls: [{
          id: `call_${Date.now()}`,
          type: 'function',
          function: {
            name: 'query_url',
            arguments: JSON.stringify({ natural_language_input: userMessage.content })
          }
        }],
        phase: 'tool_calling' 
      },
      {
        type: 'toolcall',
        toolCall: {
          id: `call_${Date.now()}`,
          type: 'function',
          function: {
            name: 'query_url',
            arguments: JSON.stringify({ natural_language_input: userMessage.content })
          }
        }
      }
    );
  } else {
    // 普通对话完成
    responses.push(
      { type: 'chunk', role: 'assistant', content: '您好！我来帮您处理问题。', phase: 'generating' },
      { 
        type: 'done', 
        role: 'assistant', 
        content: '您好！我来帮您处理问题。',
        id: `assistant-${Date.now()}`,
        timestamp: Date.now()
      }
    );
  }

  // 逐步发送响应
  const sendNextResponse = () => {
    if (step < responses.length) {
      const response = responses[step];
      res.write(`data: ${JSON.stringify(response)}\n\n`);
      step++;
      setTimeout(sendNextResponse, 500); // 500ms间隔
    } else {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  };

  sendNextResponse();
});

// LLM Abort API
app.post('/api/llm/abort', (req, res) => {
  console.log('LLM Abort 请求:', req.body);
  res.json({ success: true, message: '已中断' });
});

// MCP Tool Call API
app.post('/api/mcp/call-tool', (req, res) => {
  console.log('MCP Tool Call 请求:', req.body);
  
  const { serverId, toolName, args, callId } = req.body;
  
  // 模拟工具调用结果
  let result = {
    data: null,
    error: null
  };

  switch (toolName) {
    case 'query_url':
      result.data = {
        url: '/customers',
        title: '客户列表页面',
        description: '这里可以查看所有客户信息',
        found: true
      };
      break;
    
    case 'search':
      result.data = {
        results: [
          { id: 1, title: '搜索结果1', content: '这是搜索到的内容' },
          { id: 2, title: '搜索结果2', content: '这是另一个搜索结果' }
        ],
        total: 2
      };
      break;
    
    default:
      result.error = `未知工具: ${toolName}`;
  }

  // 模拟延迟
  setTimeout(() => {
    res.json({
      serverId,
      callId,
      ...result
    });
  }, 1000);
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Mock SSC Server'
  });
});

// 获取可用工具列表
app.get('/api/mcp/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'query_url',
        description: '根据用户自然语言问题，智能检索RAG系统，返回最合适的页面URL及相关信息',
        parameters: {
          type: 'object',
          properties: {
            natural_language_input: {
              type: 'string',
              description: '用户的自然语言查询'
            }
          },
          required: ['natural_language_input']
        }
      },
      {
        name: 'search',
        description: '搜索功能',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: '搜索关键词'
            }
          },
          required: ['query']
        }
      }
    ]
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '内部服务器错误' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Mock SSC Server running on http://localhost:${PORT}`);
  console.log('📊 Available endpoints:');
  console.log('  POST /api/llm/chat     - LLM聊天 (SSE)');
  console.log('  POST /api/llm/abort    - 中断LLM');
  console.log('  POST /api/mcp/call-tool - MCP工具调用');
  console.log('  GET  /api/mcp/tools    - 获取工具列表');
  console.log('  GET  /health           - 健康检查');
  console.log('');
  console.log('🔧 测试命令:');
  console.log('  curl http://localhost:8080/health');
  console.log('  open test/sdk-test.html');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n👋 Mock SSC Server shutting down...');
  process.exit(0);
});