// SSC Server - LLM 路由 (直接使用llmProxy，不依赖MessageBridge)
import { Router, Request, Response } from 'express';
import { getProviderForModel, getDefaultProvider } from '../config';
import { llmProxy } from '../services/llmProxy';

const router: Router = Router();

// LLM 聊天接口 (SSE) - 直接使用llmProxy
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { chatId, messages, model, temperature, tools, parallelToolCalls } = req.body;

    console.log(`[LLM Route] 收到聊天请求: ${model}, 消息数: ${messages?.length || 0}`);

    // 验证请求参数
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: '消息参数无效' });
    }

    // 根据模型获取提供商配置
    let provider = getProviderForModel(model);
    if (!provider) {
      provider = getDefaultProvider();
      if (!provider) {
        return res.status(500).json({ error: '没有可用的LLM提供商' });
      }
      console.log(`[LLM Route] 模型 ${model} 未找到对应提供商，使用默认提供商: ${provider.name}`);
    }

    // 设置SSE响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    // 发送初始连接事件
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    // 直接使用llmProxy进行流式聊天
    await llmProxy.streamChat({
      chatId,
      messages,
      model,
      temperature: temperature || 0.7,
      tools: tools || [],
      parallelToolCalls: parallelToolCalls !== false,
      baseURL: provider.baseURL,
      apiKey: provider.apiKey,
    }, {
      onChunk: (chunk) => {
        if (!res.destroyed) {
          res.write(`data: ${JSON.stringify({ type: 'chunk', ...chunk })}\n\n`);
        }
      },
      onStatus: (status) => {
        if (!res.destroyed) {
          res.write(`data: ${JSON.stringify({ type: 'status', status })}\n\n`);
        }
      },
      onToolCall: (toolCall) => {
        if (!res.destroyed) {
          res.write(`data: ${JSON.stringify({ type: 'toolcall', toolCall })}\n\n`);
        }
      },
      onDone: (result) => {
        if (!res.destroyed) {
          res.write(`data: ${JSON.stringify({ type: 'done', ...result })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
        }
      },
      onError: (error) => {
        if (!res.destroyed) {
          res.write(`data: ${JSON.stringify({ 
            type: 'error', 
            error: typeof error === 'string' ? error : error.message || '未知错误'
          })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
        }
      },
    });

  } catch (error) {
    console.error('[LLM Route] 处理聊天请求时出错:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : '内部服务器错误' 
      });
    } else {
      // 如果已经开始 SSE 响应，发送错误事件
      if (!res.destroyed) {
        res.write(`data: ${JSON.stringify({ 
          type: 'error', 
          error: error instanceof Error ? error.message : '内部服务器错误' 
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }
  }
});

// LLM 中断接口
router.post('/abort', (req: Request, res: Response) => {
  try {
    const { chatId } = req.body;
    console.log(`[LLM Route] 收到中断请求: ${chatId}`);
    
    llmProxy.abort();
    
    res.json({ success: true, message: '已中断LLM请求' });
  } catch (error) {
    console.error('[LLM Route] 中断请求出错:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '中断失败' 
    });
  }
});

// 获取可用模型列表
router.get('/models', (req: Request, res: Response) => {
  try {
    const models = [
      // DeepSeek
      { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek' },
      { id: 'deepseek-reasonable', name: 'DeepSeek reasonable', provider: 'deepseek' },
      
      // OpenAI
      { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
      
      // Qwen
      { id: 'qwen-turbo', name: 'Qwen Turbo', provider: 'qwen' },
      { id: 'qwen-plus', name: 'Qwen Plus', provider: 'qwen' },
      { id: 'qwen-max', name: 'Qwen Max', provider: 'qwen' },
      
      // Claude
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'claude' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'claude' },
    ];

    // 只返回配置了 API Key 的模型
    const availableModels = models.filter(model => {
      const provider = getProviderForModel(model.id);
      return provider !== null;
    });

    res.json({ models: availableModels });
  } catch (error) {
    console.error('[LLM Route] 获取模型列表出错:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '获取模型列表失败' 
    });
  }
});

export default router;