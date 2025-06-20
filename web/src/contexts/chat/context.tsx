import { createContext, useRef, useState, type FC, type ReactNode } from 'react';
import type { ChatMessage } from '@/types/chat';
import type { ChatContextValue } from './types';

const ChatContext = createContext<ChatContextValue | null>(null);

interface Props {
  children: ReactNode;
}

export const ChatProvider: FC<Props> = ({ children }) => {
  // UI State
  const [isGenerating, setGenerating] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<ChatMessage | null>(null);
  
  // Refs
  const messageListRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <ChatContext.Provider 
      value={{
        // State
        isGenerating,
        pendingMessage,
        
        // Actions
        setGenerating,
        setPendingMessage,
        scrollToBottom,
        
        // Refs
        messageListRef,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
