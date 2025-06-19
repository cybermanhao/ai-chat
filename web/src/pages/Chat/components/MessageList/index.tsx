import React from 'react';
import MessageCard2, { type MessageStatus } from '../MessageCard2';
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
    <div className="message-list">      {messages?.map((message) => (
        <MessageCard2 
          key={message.id} 
          {...message} 
          status={message.status || 'stable'} 
        />
      ))}
    </div>
  );
};

export default MessageList;
