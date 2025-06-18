// Chat message roles
export type ChatRole = 'user' | 'assistant' | 'system';

// Base message interface
export interface Message {
  content: string;
  role: ChatRole;
}

// Message with ID for UI display
export interface ChatMessage extends Message {
  id: string;
  timestamp: number;
}
