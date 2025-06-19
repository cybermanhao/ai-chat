import type { ChatMessage } from './index';

export type MessageStatus = 'connecting' | 'thinking' | 'answering' | 'stable';

export interface StreamingMessage extends ChatMessage {
  reasoning_content?: string;
  status: MessageStatus;
}
