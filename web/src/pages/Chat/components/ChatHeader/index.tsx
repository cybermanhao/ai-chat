import React from 'react';
import { Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '@/store/chatStore';
import './styles.less';

interface ChatHeaderProps {
  title?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  const { currentId: currentChatId, chats: chatList, setCurrentId } = useChatStore();

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
