import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import MessageCard from '../MessageCard';
import ClientNoticeCard from '../ClientNoticeCard';
import type { ChatMessage, ClientNoticeMessage } from '@/types/chat';
import './styles.less';
import type { MessageStatus } from '@engine/types/chat';

interface MessageListProps {
  messages?: Array<ChatMessage & {
    streaming?: boolean; 
    status?: MessageStatus; 
    reasoning_content?: string;
    noticeType?: 'error' | 'warning' | 'info';
    errorCode?: string;
  }>;
  isGenerating?: boolean;
  activeChatRef?: React.RefObject<HTMLDivElement>;
}

const EMPTY_ARRAY: any[] = [];

const MessageList = React.forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages, isGenerating, activeChatRef }, ref) => {
    // 支持直接用 redux state
    const currentChatId = useSelector((state: RootState) => state.chat.currentChatId);
    const reduxMessages = useSelector((state: RootState) => {
      return state.chat.chatData[currentChatId || '']?.messages || EMPTY_ARRAY;
    });
    const reduxIsGenerating = useSelector((state: RootState) => state.chat.isGenerating);
    const list = messages ?? reduxMessages;
    const generating = isGenerating ?? reduxIsGenerating;
    return (
      <div className="message-list" ref={ref}>
        {list?.map((message) => {
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
              chatId={currentChatId || ''}
              {...message} 
              status={message.status || 'stable'} 
              isGenerating={message.status === 'generating' && generating}
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
