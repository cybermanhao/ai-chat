import { LLMService as EngineLLMService, getCurrentStream } from '@engine/service/llmService';

// Web 端 LLMService，允许 dangerouslyAllowBrowser
export class LLMService extends EngineLLMService {
  protected override getDangerouslyAllowBrowser(): boolean {
    return true;
  }
}

export const llmService = new LLMService();
export { getCurrentStream };
