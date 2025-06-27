import React from 'react';
import { Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store';
import { setCurrentChat } from '@/store/chatSlice';
import './styles.less';

interface ChatHeaderProps {
  title?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentChatId = useSelector((state: RootState) => state.chat.currentChatId);
  const chatList = useSelector((state: RootState) => state.chat.chatList);

  const handleChatChange = (newChatId: string) => {
    dispatch(setCurrentChat(newChatId));
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
