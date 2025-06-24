// engine/service/llmService.ts
// 多端同构 LLMService 纯逻辑实现
import { OpenAI } from 'openai';
import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam
} from 'openai/resources/chat/completions';
import type { ChatMessage } from '../types/chat';
import type { ModelConfig } from '../types/model';
import type { Stream } from 'openai/streaming';
import type { ExtendedChatCompletionChunk } from '../types/openai-extended';
import type { LLMConfig } from '../types/llm';

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

  // 兼容旧 generate 签名，自动转为新签名调用
  async generate(
    messagesOrRequest: ChatMessage[] | Record<string, unknown>,
    modelConfigOrSignal?: ModelConfig | AbortSignal,
    llmConfig?: LLMConfig,
    signal?: AbortSignal
  ): Promise<Stream<ExtendedChatCompletionChunk>> {
    // 新签名：generate(request, signal)
    if (Array.isArray(messagesOrRequest) && modelConfigOrSignal && llmConfig) {
      // 旧签名兼容：generate(messages, modelConfig, llmConfig, signal)
      const messages = messagesOrRequest;
      const modelConfig = modelConfigOrSignal as ModelConfig;
      const request: Record<string, unknown> = {
        model: llmConfig.model,
        messages: this.formatMessages(messages),
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens,
        stream: true,
        ...(llmConfig.tools && { tools: llmConfig.tools }),
        ...(llmConfig.parallelToolCalls && { tool_choice: 'auto' }),
        baseUrl: llmConfig.baseUrl,
        apiKey: llmConfig.apiKey,
        systemPrompt: llmConfig.systemPrompt,
      };
      return this.generate(request, signal);
    }
    // 新签名实现
    const request = messagesOrRequest as Record<string, unknown>;
    const client = this.createClient({
      baseUrl: (request.baseUrl || request.apiUrl || '') as string,
      apiKey: (request.apiKey || '') as string,
      model: (request.model || '') as string,
      temperature: (request.temperature as number) ?? 0.7,
      maxTokens: (request.max_tokens as number) ?? 2048,
      systemPrompt: (request.systemPrompt as string) ?? '',
    });
    // tool_choice 只允许 'auto' | 'none' | { function: { name: string } }
    let toolChoice: any = undefined;
    if (request.tool_choice === 'auto' || request.tool_choice === 'none') {
      toolChoice = request.tool_choice;
    } else if (
      typeof request.tool_choice === 'object' &&
      request.tool_choice !== null &&
      'function' in request.tool_choice
    ) {
      toolChoice = request.tool_choice;
    }
    const params: ChatCompletionCreateParams = {
      model: (request.model as string) || '',
      messages: (request.messages as ChatCompletionMessageParam[]) || [],
      temperature: typeof request.temperature === 'number' ? request.temperature : 0.7,
      max_tokens: typeof request.max_tokens === 'number' ? request.max_tokens : 2048,
      stream: true,
      ...(Array.isArray(request.tools) ? { tools: request.tools } : {}),
      ...(toolChoice !== undefined ? { tool_choice: toolChoice } : {}),
    };
    const abortController = new AbortController();
    currentStream = abortController;
    try {
      const timeoutId = setTimeout(() => {
        if (abortController && !abortController.signal.aborted) {
          abortController.abort('timeout');
        }
      }, 10000);
      const response = await client.chat.completions.create(params, {
        signal: (modelConfigOrSignal as AbortSignal) || abortController.signal
      }) as unknown as Stream<ExtendedChatCompletionChunk>;
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (error instanceof Error) {
        const enhancedError = new Error(this.getErrorMessage(error));
        enhancedError.name = error.name;
        (enhancedError as Error & { code: string }).code = this.getErrorCode(error);
        throw enhancedError;
      }
      throw error;
    }
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
