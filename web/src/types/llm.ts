import type { ChatCompletionCreateParams } from 'openai/resources/chat/completions';

export interface LLM {
  id: string;
  name: string;
  baseUrl: string;
  models: string[];
  provider: string;
  isOpenAICompatible: boolean;
  description: string;
  website: string;
  userToken: string;
  userModel: string;
}

export interface LLMConfig {
  apiKey?: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  tools?: ChatCompletionCreateParams['tools'];
  parallelToolCalls?: boolean;
}

export interface LLMConfigState {
  activeLLMId: string | null;
  configs: Record<string, LLMConfig>;
  
  // Actions
  setActiveLLM: (llmId: string | null) => void;
  updateConfig: (llmId: string, config: Partial<LLMConfig>) => void;
  resetConfig: (llmId: string) => void;
}

export const defaultLLMConfig: LLMConfig = {
  baseUrl: '',
  model: '',
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: 'You are a helpful assistant.',
};
