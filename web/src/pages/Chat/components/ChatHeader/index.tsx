import React from 'react';
import { Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useStore } from 'zustand';
import { useChatStore } from '@/store/chatStore';
import './styles.less';

interface ChatHeaderProps {
  title?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  const currentChatId = useStore(useChatStore, state => state.currentId);
  const chatList = useStore(useChatStore, state => state.chats);
  const setCurrentId = useStore(useChatStore, state => state.setCurrentId);

  const handleChatChange = (newChatId: string) => {
    setCurrentId(newChatId);
    navigate(`/chat/${newChatId}`);
  };

  return (
    <div className="chat-header">
      <Select
        value={currentChatId}
        onChange={handleChatChange}
        className="chat-selector"
        placeholder="选择聊天"
        options={chatList.map(chat => ({
          label: chat.title || title || '新对话',
          value: chat.id
        }))}
      />
    </div>
  );
};

export default ChatHeader;
