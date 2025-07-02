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
      // 确保元素可见并尝试多种滚动方式
      try {
        const element = messageListRef.current;
        
        console.log('[ChatContext] scrollToBottom called', {
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          scrollTop: element.scrollTop,
          shouldScroll: element.scrollHeight > element.clientHeight
        });
        
        // 使用 requestAnimationFrame 确保 DOM 完全更新
        requestAnimationFrame(() => {
          // 方式1: 使用 scrollTo (推荐)
          element.scrollTo({
            top: element.scrollHeight,
            behavior: 'smooth'
          });
          
          // 备用方式: 如果上面不工作，使用 scrollTop
          setTimeout(() => {
            const currentScrollTop = element.scrollTop;
            const maxScrollTop = element.scrollHeight - element.clientHeight;
            
            if (Math.abs(currentScrollTop - maxScrollTop) > 5) {
              console.log('[ChatContext] Using fallback scroll', {
                currentScrollTop,
                maxScrollTop,
                difference: Math.abs(currentScrollTop - maxScrollTop)
              });
              element.scrollTop = element.scrollHeight;
            }
          }, 300);
        });
        
      } catch (error) {
        console.warn('[ChatContext] scrollToBottom failed:', error);
      }
    } else {
      console.warn('[ChatContext] messageListRef is null');
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
