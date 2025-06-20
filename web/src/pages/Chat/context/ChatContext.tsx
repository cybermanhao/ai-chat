import React, { createContext, useContext } from 'react';
import type { ChatInfo } from '@/types/chat';

export interface ChatContextType {
  chatId: string | undefined;
  currentChatId: string | null;
  chatList: ChatInfo[];
  switchChat: (chatId: string) => void;
  activeChatRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatContext = createContext<ChatContextType | null>(null);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
