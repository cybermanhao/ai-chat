export interface OpenAIModel {
  id: string;
  name: string;
  maxTokens: number;
  type: 'gpt' | 'embedding' | 'image';
  inputTokenPrice: number;  // 每1k token的输入价格
  outputTokenPrice: number; // 每1k token的输出价格
}

export interface OpenAIEndpoint {
  id: string;
  name: string;
  baseURL: string;
  apiKey: string;
  models: OpenAIModel[];
  isConnected: boolean;
  error?: string;
}

export interface OpenAIState {
  endpoints: OpenAIEndpoint[];
  activeEndpointId?: string;
  defaultModels: OpenAIModel[];
}

export type OpenAIEndpointCreate = Omit<OpenAIEndpoint, 'id' | 'models' | 'isConnected' | 'error'>;
export type OpenAIEndpointUpdate = Partial<Omit<OpenAIEndpoint, 'id'>>;

// API调用时的角色类型
export type APIMessageRole = 'user' | 'developer';

// UI显示时的角色类型
export type UIMessageRole = 'user' | 'assistant';

export interface APIMessage {
  role: APIMessageRole;
  content: string;
}

export interface UIMessage {
  role: UIMessageRole;
  content: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  messages: APIMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: APIMessage;
    finish_reason: string;
    index: number;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
