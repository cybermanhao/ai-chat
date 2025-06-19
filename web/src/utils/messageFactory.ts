import type { StreamingMessage } from '../types/chat';

export const createMessage = {
  user: (content: string): StreamingMessage => ({
    id: `msg-${Date.now()}`,
    role: 'user',
    content: content.trim(),
    timestamp: Date.now(),
    status: 'stable'
  }),

  assistant: (messageId: string): StreamingMessage => ({
    id: `${messageId}-response`,
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    status: 'connecting'
  })
};
