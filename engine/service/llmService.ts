// engine/service/llmService.ts
// 多端同构 LLMService 纯逻辑实现
import { OpenAI } from 'openai';
import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam
} from 'openai/resources/chat/completions';
import type { ChatMessage, StreamChunk } from '../types/chat';
import type { ModelConfig } from '../types/model';
import type { Stream } from 'openai/streaming';
import type { ExtendedChatCompletionChunk } from '../types/openai-extended';
import type { LLMConfig } from '../types/llm';
import { streamHandler, handleResponseStream } from '../stream/streamHandler';

let currentStream: AbortController | null = null;

export class LLMService {
  protected getDangerouslyAllowBrowser(): boolean {
    // 可被 web 端重载
    return false;
  }

  protected createClient(config: LLMConfig): OpenAI {
    return new OpenAI({
      baseURL: config.baseUrl,
      apiKey: config.apiKey || '',
      dangerouslyAllowBrowser: this.getDangerouslyAllowBrowser()
    });
  }

  protected formatMessages(messages: Array<ChatMessage>): ChatCompletionMessageParam[] {
    const result: ChatCompletionMessageParam[] = [];
    for (const msg of messages) {
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      const baseMessage = {
        content,
        ...(msg.name && { name: msg.name })
      };
      let formattedMessage: ChatCompletionMessageParam;
      switch (msg.role) {
        case 'system':
          formattedMessage = { ...baseMessage, role: 'system' };
          break;
        case 'user':
          formattedMessage = { ...baseMessage, role: 'user' };
          break;
        case 'assistant':
          if ('tool_calls' in msg) {
            formattedMessage = { ...baseMessage, role: 'assistant', tool_calls: (msg as any).tool_calls };
          } else {
            formattedMessage = { ...baseMessage, role: 'assistant' };
          }
          break;
        case 'tool':
          if ('tool_call_id' in msg) {
            formattedMessage = { ...baseMessage, role: 'tool', tool_call_id: (msg as any).tool_call_id };
          } else {
            throw new Error('Tool messages must have tool_call_id');
          }
          break;
        default:
          throw new Error(`Unsupported message role: ${msg.role}`);
      }
      result.push(formattedMessage);
    }
    return result;
  }

  async generate(
    request: {
      model: string;
      messages: any[];
      temperature?: number;
      max_tokens?: number;
      stream?: boolean;
      tools?: any;
      tool_choice?: any;
      baseUrl: string;
      apiKey: string;
      systemPrompt?: string;
    },
    {
      onChunk,
      onDone,
      signal
    }: {
      onChunk?: (chunk: StreamChunk) => void | Promise<void>;
      onDone?: (result: any) => void | Promise<void>;
      signal?: AbortSignal;
    } = {}
  ) {
    const client = new OpenAI({
      baseURL: request.baseUrl,
      apiKey: request.apiKey,
      dangerouslyAllowBrowser: true
    });
    const params = {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 2048,
      stream: true,
      ...(Array.isArray(request.tools) ? { tools: request.tools } : {}),
      ...(request.tool_choice !== undefined ? { tool_choice: request.tool_choice } : {}),
    };
    try {
      // 直接用 fetch 拿到 Response
      const response = await fetch(`${request.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(request.apiKey ? { Authorization: `Bearer ${request.apiKey}` } : {})
        },
        body: JSON.stringify(params),
        signal
      });
      // 用 engine 层 streamHandler 解析流
      const chunkIter = streamHandler(response);
      // 用 handleResponseStream 消费流
      await handleResponseStream(chunkIter, onChunk, onDone);
    } catch (error) {
      if (onDone) onDone({ error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * 创建聊天流的核心方法，子类必须实现
   * @param messages 聊天消息
   * @param options 额外选项，如 llmConfig
   */
  async createChatStream(
    messages: any[],
    options?: any,
  ): Promise<ReadableStream<Uint8Array>> {
    throw new Error('LLMService.createChatStream must be implemented by a subclass');
  }

  protected getErrorMessage(error: Error): string {
    const message = error.message;
    if (error.name === 'AbortError') return '请求已被取消';
    if (message.includes('timeout')) return '请求超时，服务器响应时间过长';
    if (message.includes('network') || message.includes('ENOTFOUND')) return '网络连接错误，请检查您的网络状态';
    if (message.includes('401')) return 'API密钥无效或已过期，请检查您的API密钥设置';
    if (message.includes('403')) return '没有访问权限，请检查您的API密钥权限';
    if (message.includes('429')) return '请求频率过高，请稍后再试';
    return `生成出错: ${message}`;
  }

  protected getErrorCode(error: Error): string {
    if (error.name === 'AbortError') return 'ERR_GENERATION_ABORTED';
    const message = error.message.toLowerCase();
    if (message.includes('timeout')) return 'ERR_TIMEOUT';
    if (message.includes('network') || message.includes('enotfound')) return 'ERR_NETWORK';
    if (message.includes('401') || message.includes('unauthorized')) return 'ERR_AUTH';
    if (message.includes('429') || message.includes('rate limit')) return 'ERR_RATE_LIMIT';
    if (message.includes('model')) return 'ERR_MODEL';
    return 'ERR_API';
  }

  abortCurrentStream() {
    if (currentStream) {
      currentStream.abort();
      currentStream = null;
    }
  }
}

export const getCurrentStream = () => currentStream;
