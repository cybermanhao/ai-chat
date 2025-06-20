import { createContext, useRef, useState, type FC, type ReactNode } from 'react';
import type { ChatMessage } from '../../../../engine/types/chat';
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
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const activeChatRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const scrollToChat = () => {
    if (activeChatRef.current) {
      activeChatRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <ChatContext.Provider
      value={{
        isGenerating,
        pendingMessage,
        setGenerating,
        setPendingMessage,
        scrollToBottom,
        scrollToChat,
        messageListRef,
        activeChatRef,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
