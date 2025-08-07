// SSC Server - LLM Proxy Service
// 复用 engine/service/llmService.ts 的核心逻辑，适配为服务端代理

import { OpenAI } from 'openai';
import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam
} from 'openai/resources/chat/completions';
import type { Stream } from 'openai/streaming';
import fetch from 'node-fetch';

// 复用的流处理逻辑（简化版）
interface StreamChunk {
  role: string;
  content: string;
  reasoning_content?: string;
  tool_calls?: any[];
  phase: 'thinking' | 'generating' | 'tool_calling';
}

interface LLMProxyOptions {
  chatId?: string;
  baseURL: string;
  apiKey: string;
  model: string;
  messages: any[];
  temperature?: number;
  tools?: any[];
  parallelToolCalls?: boolean;
  signal?: AbortSignal;
  assistantMessageId?: string;
}

interface LLMProxyCallbacks {
  onChunk?: (chunk: StreamChunk) => void;
  onDone?: (result: any) => void;
  onError?: (error: any) => void;
  onToolCall?: (toolCall: any) => void;
  onStatus?: (status: string) => void;
}

export class LLMProxy {
  private currentStream: AsyncIterable<any> | null = null;

  async streamChat(options: LLMProxyOptions, callbacks: LLMProxyCallbacks = {}) {
    const {
      chatId,
      baseURL,
      apiKey,
      model,
      messages,
      temperature = 0.7,
      tools = [],
      parallelToolCalls = true,
      signal,
      assistantMessageId
    } = options;

    const {
      onChunk,
      onDone,
      onError,
      onToolCall,
      onStatus
    } = callbacks;

    console.log(`[LLMProxy] 开始处理聊天请求: ${model}`);
    console.log(`[LLMProxy] 消息数量: ${messages.length}`);
    console.log(`[LLMProxy] 工具数量: ${tools.length}`);

    try {
      // 状态回调
      onStatus?.('connecting');

      // 创建 OpenAI 客户端
      const client = new OpenAI({
        baseURL,
        apiKey,
      });

      // 清理消息格式
      const cleanedMessages = this.cleanMessages(messages);
      
      // 构建请求参数
      const requestParams: ChatCompletionCreateParams = {
        model,
        messages: cleanedMessages,
        temperature,
        stream: true,
        ...(tools.length > 0 && {
          tools: this.serializeTools(tools),
          parallel_tool_calls: parallelToolCalls,
        }),
      };

      console.log(`[LLMProxy] 最终请求参数:`, JSON.stringify(requestParams, null, 2));

      // 发起流式请求
      const stream = await client.chat.completions.create(requestParams, {
        signal,
      });

      this.currentStream = stream;
      onStatus?.('thinking');

      // 处理流式响应
      await this.handleStream(stream, {
        onChunk,
        onDone: (result) => {
          const finalResult = {
            ...result,
            id: assistantMessageId || `assistant-${Date.now()}`,
            timestamp: Date.now(),
          };
          onDone?.(finalResult);
        },
        onError,
        onToolCall,
        onStatus,
      });

    } catch (error) {
      console.error('[LLMProxy] 流式聊天错误:', error);
      onError?.(error);
    } finally {
      this.currentStream = null;
    }
  }

  private async handleStream(
    stream: Stream<any>,
    callbacks: LLMProxyCallbacks
  ) {
    const { onChunk, onDone, onError, onStatus } = callbacks;

    console.log('[LLMProxy] 开始转发原始流数据，不做累加处理');

    try {
      onStatus?.('thinking');

      for await (const chunk of stream) {
        // 直接转发原始 OpenAI chunk，不做任何累加或分析
        // 客户端将通过 streamHandler 统一处理累加和工具调用检测
        onChunk?.(chunk);
      }

      // 流结束信号
      onDone?.({ type: 'stream_end' });

    } catch (error) {
      console.error('[LLMProxy] 流处理错误:', error);
      onError?.(error);
    }
  }

  // 已移除：processToolCallsDelta 方法
  // 原因：服务端不再处理工具调用累加，由客户端 streamHandler 统一处理

  // 已移除：isValidToolCall 方法
  // 原因：服务端不再验证工具调用，由客户端 streamHandler 统一处理

  private cleanMessages(messages: any[]): ChatCompletionMessageParam[] {
    return messages
      .filter(msg => msg && msg.role && (msg.content || msg.tool_calls))
      .map(msg => {
        const cleaned: any = {
          role: msg.role,
        };

        if (msg.content) {
          cleaned.content = msg.content;
        }

        if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
          cleaned.tool_calls = msg.tool_calls;
        }

        if (msg.tool_call_id) {
          cleaned.tool_call_id = msg.tool_call_id;
        }

        return cleaned;
      });
  }

  private serializeTools(tools: any[]): any[] {
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name || tool.function?.name,
        description: tool.description || tool.function?.description,
        parameters: tool.parameters || tool.function?.parameters || {
          type: 'object',
          properties: {},
        },
      },
    }));
  }

  // 中断当前流
  abort() {
    if (this.currentStream) {
      console.log('[LLMProxy] 中断当前流');
      this.currentStream = null;
    }
  }
}

// 单例实例
export const llmProxy = new LLMProxy();