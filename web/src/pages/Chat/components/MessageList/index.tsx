import React, { forwardRef } from 'react';
import MessageCard, { type MessageStatus } from '../MessageCard';
import ClientNoticeCard from '../ClientNoticeCard';
import type { ChatMessage, ClientNoticeMessage } from '@/types/chat';
import './styles.less';

interface MessageListProps {
  messages: Array<ChatMessage & { 
    streaming?: boolean; 
    status?: MessageStatus; 
    reasoning_content?: string;
    noticeType?: 'error' | 'warning' | 'info';
    errorCode?: string;
  }>;
  isGenerating?: boolean;
  activeChatRef?: React.RefObject<HTMLDivElement>;
}

const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages = [], isGenerating, activeChatRef }, ref) => {
    return (
      <div className="message-list" ref={ref}>
        {messages?.map((message) => {
          // 使用专门的组件渲染客户端提示消息
          if (message.role === 'client-notice') {            return (
              <ClientNoticeCard
                key={message.id}
                content={message.content}
                noticeType={(message as ClientNoticeMessage).noticeType}
                errorCode={(message as ClientNoticeMessage).errorCode}
                timestamp={message.timestamp}
              />
            );
          }
          // 渲染标准消息卡片
          return (
            <MessageCard 
              key={message.id} 
              {...message} 
              status={message.status || 'stable'} 
              isGenerating={message.status === 'generating' && isGenerating}
            />
          );
        })}
        {activeChatRef && <div ref={activeChatRef} style={{ height: 1 }} />}
      </div>
    );
  }
);

MessageList.displayName = 'MessageList';

export default MessageList;
