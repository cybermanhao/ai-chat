import { useRef, useState } from 'react';
import type { ChatMessage } from '@/types/chat';
import ChatContext from './context';

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  // UI State
  const [isGenerating, setGenerating] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<ChatMessage | null>(null);
  
  // Refs
  const messageListRef = useRef<HTMLDivElement>(null);
  const activeChatRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const scrollToChat = () => {
    if (activeChatRef.current) {
      activeChatRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  };

  return (
    <ChatContext.Provider value={{
      // State
      isGenerating,
      pendingMessage,
      messageListRef,
      activeChatRef,
      
      // Actions
      setGenerating,
      setPendingMessage,
      scrollToBottom,
      scrollToChat,
    }}>
      {children}
    </ChatContext.Provider>
  );
};
