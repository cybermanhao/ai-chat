import React from 'react';
import MessageCard from '../MessageCard';
import type { ChatMessage } from '@/types';
import './styles.less';

interface MessageListProps {
  messages: ChatMessage[];
}

const MessageList: React.FC<MessageListProps> = ({ messages = [] }) => {
  return (
    <div className="message-list">
      {messages?.map((message) => (
        <MessageCard key={message.id} {...message} />
      ))}
    </div>
  );
};

export default MessageList;
