import { OpenAI } from 'openai';
import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam
} from 'openai/resources/chat/completions';
import type { ChatMessage } from '@/types/chat';
import type { ModelConfig } from '@/types/model';
import type { Stream } from 'openai/streaming';
import type { ExtendedChatCompletionChunk } from '@/types/openai-extended';

import type { LLMConfig } from '@/types/llm';

// 当前活跃的流
let currentStream: AbortController | null = null;

export class LLMService {  
  private formatMessages(messages: Array<ChatMessage>): ChatCompletionMessageParam[] {
    const result: ChatCompletionMessageParam[] = [];
    
    for (const msg of messages) {
      // 确保content是字符串类型
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      
      // 基础消息属性
      const baseMessage = {
        content,
        ...(msg.name && { name: msg.name })
      };

      let formattedMessage: ChatCompletionMessageParam;
      
      switch (msg.role) {
        case 'system': {
          formattedMessage = {
            ...baseMessage,
            role: 'system'
          };
          break;
        }
        case 'user': {
          formattedMessage = {
            ...baseMessage,
            role: 'user'
          };
          break;
        }
        case 'assistant': {
          if ('tool_calls' in msg) {
            formattedMessage = {
              ...baseMessage,
              role: 'assistant',
              tool_calls: msg.tool_calls
            };
          } else {
            formattedMessage = {
              ...baseMessage,
              role: 'assistant'
            };
          }
          break;
        }
        case 'tool': {
          if ('tool_call_id' in msg) {
            formattedMessage = {
              ...baseMessage,
              role: 'tool',
              tool_call_id: msg.tool_call_id
            };
          } else {
            throw new Error('Tool messages must have tool_call_id');
          }
          break;
        }
        default: {
          throw new Error(`Unsupported message role: ${msg.role}`);
        }
      }
      
      result.push(formattedMessage);
    }
    
    return result;
  }  
  private createClient(config: LLMConfig): OpenAI {
    return new OpenAI({
      baseURL: config.baseUrl,
      apiKey: config.apiKey || '',
      dangerouslyAllowBrowser: true
    });
  }  async generate(
    messages: ChatMessage[],
    modelConfig: ModelConfig,
    llmConfig: LLMConfig,
    signal?: AbortSignal
  ): Promise<Stream<ExtendedChatCompletionChunk>> {
    const client = this.createClient(llmConfig);
    const params: ChatCompletionCreateParams = {
      model: llmConfig.model,
      messages: this.formatMessages(messages),
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.maxTokens,
      stream: true,
      ...(llmConfig.tools && { tools: llmConfig.tools }),
      ...(llmConfig.parallelToolCalls && { tool_choice: 'auto' })
    };

    const abortController = new AbortController();
    currentStream = abortController;

    try {
      // 设置10秒超时
      const timeoutId = setTimeout(() => {
        if (abortController && !abortController.signal.aborted) {
          abortController.abort('timeout');
        }
      }, 10000);
      
      // 强制断言 response 类型为 Stream<ExtendedChatCompletionChunk>
      const response = await client.chat.completions.create(params, {
        signal: signal || abortController.signal
      }) as unknown as Stream<ExtendedChatCompletionChunk>;
      
      // 请求成功，清除超时
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      console.error('Stream creation error:', error);
      
    // 处理特定的API错误
      if (error instanceof Error) {
        // 增强错误对象，添加更多上下文信息
        const enhancedError = new Error(this.getErrorMessage(error));
        enhancedError.name = error.name;
        // 使用类型断言，避免 any
        (enhancedError as Error & { code: string }).code = this.getErrorCode(error);
        throw enhancedError;
      }
      
      throw error;
    }
  }
  
  // 获取用户友好的错误消息
  private getErrorMessage(error: Error): string {
    const message = error.message;
    
    if (error.name === 'AbortError') {
      return '请求已被取消';
    }
    
    if (message.includes('timeout')) {
      return '请求超时，服务器响应时间过长';
    }
    
    if (message.includes('network') || message.includes('ENOTFOUND')) {
      return '网络连接错误，请检查您的网络状态';
    }
    
    if (message.includes('401')) {
      return 'API密钥无效或已过期，请检查您的API密钥设置';
    }
    
    if (message.includes('403')) {
      return '没有访问权限，请检查您的API密钥权限';
    }
    
    if (message.includes('429')) {
      return '请求频率过高，请稍后再试';
    }
    
    return `生成出错: ${message}`;
  }
  
  // 获取错误代码
  private getErrorCode(error: Error): string {
    if (error.name === 'AbortError') {
      return 'ERR_GENERATION_ABORTED';
    }
    
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout')) {
      return 'ERR_TIMEOUT';
    }
    
    if (message.includes('network') || message.includes('enotfound')) {
      return 'ERR_NETWORK';
    }
    
    if (message.includes('401') || message.includes('unauthorized')) {
      return 'ERR_AUTH';
    }
    
    if (message.includes('429') || message.includes('rate limit')) {
      return 'ERR_RATE_LIMIT';
    }
    
    if (message.includes('model')) {
      return 'ERR_MODEL';
    }
    
    return 'ERR_API';
  }
  

  abortCurrentStream() {
    if (currentStream) {
      currentStream.abort();
      currentStream = null;
    }
  }
}

export const llmService = new LLMService();
export const getCurrentStream = () => currentStream;
