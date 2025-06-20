import React from 'react';
import { Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '@/store/chatStore';
import scrollIntoView from 'scroll-into-view-if-needed';
import './styles.less';

const ChatHeader: React.FC = () => {
  const navigate = useNavigate();
  const { currentId: currentChatId, chats: chatList, activeChatRef, setCurrentId } = useChatStore();

  const handleChatChange = (newChatId: string) => {
    setCurrentId(newChatId);
    navigate(`/chat/${newChatId}`);
      // 等待 DOM 更新后滚动到选中的聊天项
    requestAnimationFrame(() => {
      if (activeChatRef?.current) {
        scrollIntoView(activeChatRef.current, {
          scrollMode: 'if-needed',
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    });
  };

  return (
    <div className="chat-header">
      <Select
        value={currentChatId}
        onChange={handleChatChange}
        style={{ width: 240 }}      options={chatList.map(chat => ({
          label: chat.title,
          value: chat.id
        })).reverse()}
        placeholder="选择对话"
      />
    </div>
  );
};

export default ChatHeader;
