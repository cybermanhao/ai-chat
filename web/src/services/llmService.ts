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
}

export default WebLLMService;
