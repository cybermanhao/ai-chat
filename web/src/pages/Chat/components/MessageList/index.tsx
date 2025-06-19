import React from 'react';
import MessageCard, { type MessageStatus } from '../MessageCard';
import type { ChatMessage } from '@/types';
import './styles.less';

interface MessageListProps {
  messages: Array<ChatMessage & { 
    streaming?: boolean; 
    status?: MessageStatus; 
    reasoning_content?: string;
  }>;
}

const MessageList: React.FC<MessageListProps> = ({ messages = [] }) => {
  return (
    <div className="message-list">      {messages?.map((message) => (        <MessageCard 
          key={message.id} 
          {...message} 
          status={message.status || 'stable'} 
        />
      ))}
    </div>
  );
};

export default MessageList;
