import { LLMService as BaseLLMService } from '@engine/service/llmService';
import { OpenAI } from 'openai';

export class WebLLMService extends BaseLLMService {
  protected getDangerouslyAllowBrowser(): boolean {
    return true;
  }

  // 支持自定义 headers（如 Authorization）
  protected createClient(config: any): OpenAI {
    return new OpenAI({
      baseURL: config.baseUrl,
      apiKey: config.apiKey || '',
      dangerouslyAllowBrowser: true,
      defaultHeaders: {
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        ...config.extraHeaders,
      },
    });
  }

  /**
   * Web 端实现：调用父类 generate，转为 ReadableStream<Uint8Array>
   */
  async createChatStream(messages: any[], options?: any): Promise<ReadableStream<Uint8Array>> {
    // 1. 获取当前 LLM 配置（model、apiKey、baseUrl、temperature、maxTokens、systemPrompt、tools 等）
    // options 可能包含 modelConfig/llmConfig，优先级：options > this 默认
    const llmConfig = options?.llmConfig || options || {};
    const modelConfig = options?.modelConfig || {};
    // 2. 调用父类 generate，获取 OpenAI Stream
    const stream = await super.generate(
      messages,
      modelConfig,
      llmConfig
    );
    // 3. 将 OpenAI Stream 转为 Web ReadableStream<Uint8Array>
    // openai/streaming 的 Stream 实现有 .toReadableStream()
    if (typeof (stream as any).toReadableStream === 'function') {
      return (stream as any).toReadableStream();
    }
    // 兼容：如果本身就是 ReadableStream
    if (typeof window !== 'undefined' && stream instanceof ReadableStream) {
      return stream as ReadableStream<Uint8Array>;
    }
    throw new Error('无法将 LLM 流转为 ReadableStream');
  }
}

export const llmService = new WebLLMService();
