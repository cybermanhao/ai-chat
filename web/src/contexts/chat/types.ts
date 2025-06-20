import { type RefObject } from 'react';
import type { ChatMessage } from '@/types/chat';

export interface ChatUIState {
  isGenerating: boolean;
  pendingMessage: ChatMessage | null;
  messageListRef: RefObject<HTMLDivElement | null>;
  activeChatRef: RefObject<HTMLDivElement | null>;
}

export interface ChatUIActions {
  setGenerating: (status: boolean) => void;
  setPendingMessage: (message: ChatMessage | null) => void;
  scrollToBottom: () => void;
  scrollToChat: () => void;
}

export interface ChatContextValue extends ChatUIState, ChatUIActions {}
