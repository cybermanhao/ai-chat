import type { 
  ChatCompletionRole,
  ChatCompletionContentPart
} from 'openai/resources/chat/completions';

// 基础消息接口
export interface Message {
  content: string | ChatCompletionContentPart[];
  role: ChatCompletionRole;
  name?: string;
}

// UI展示用的消息接口
export interface OpenAIMessage extends Message {
  id: string;
  timestamp: number;
}
