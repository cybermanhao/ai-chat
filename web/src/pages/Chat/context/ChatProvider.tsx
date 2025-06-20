import React, { useRef, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useChatList } from '@/hooks/useChatList';
import { ChatContext } from './ChatContext';

const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { chatId } = useParams<{ chatId: string }>();
  const { chatList, currentChatId, switchChat } = useChatList();
  const activeChatRef = useRef<HTMLDivElement>(null);

  // 同步路由参数到当前聊天
  useEffect(() => {
    if (chatId && chatId !== currentChatId) {
      switchChat(chatId);
    }
  }, [chatId, currentChatId, switchChat]);

  const value = useMemo(() => ({
    chatId,
    currentChatId,
    chatList,
    switchChat,
    activeChatRef
  }), [chatId, currentChatId, chatList, switchChat]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;
