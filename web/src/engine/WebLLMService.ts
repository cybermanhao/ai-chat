// Web 端 LLM 服务适配器，实现 LLMService 接口
import { LLMService as BaseLLMService } from '@engine/service/llmService';
import { OpenAI } from 'openai';

export class WebLLMAdapter extends BaseLLMService {
  protected getDangerouslyAllowBrowser(): boolean {
    return true;
  }

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
