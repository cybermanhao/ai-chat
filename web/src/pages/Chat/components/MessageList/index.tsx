import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import MessageCard from '../MessageCard';
import ClientNoticeCard from '../ClientNoticeCard';
import type { EnrichedMessage } from '@engine/types/chat';
import './styles.less';

export type DisplayMessage = EnrichedMessage;

interface MessageListProps {
  // 只负责渲染消息分组，消息本身不再携带流程状态
  messages?: Array<EnrichedMessage>;
  isGenerating?: boolean;
  activeChatRef?: React.RefObject<HTMLDivElement>;
}

const EMPTY_ARRAY: any[] = [];

const MessageList = React.forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages, activeChatRef }, ref) => {
    // 优先使用 props 传入的 messages，否则从 Redux 读取
    const currentChatId = useSelector((state: RootState) => state.chat.currentChatId);
    const rawMessages = useSelector((state: RootState) => 
      state.chat.chatData[currentChatId || '']?.messages || EMPTY_ARRAY
    );
    // 获取当前聊天的 MessageCard 状态
    const messageCardStatus = useSelector((state: RootState) => 
      state.chat.messageCardStatus[currentChatId || ''] ?? 'stable'
    );
    
    // 直接使用传入的 messages 或 Redux 中的 rawMessages
    const list: EnrichedMessage[] = messages || rawMessages;
    // 分组逻辑：将连续的 assistant/tool 消息聚合为一组，传给 MessageCard
    const grouped: EnrichedMessage[][] = [];
    let buffer: EnrichedMessage[] = [];
    for (const msg of list) {
      if (msg.role === 'assistant' || msg.role === 'tool') {
        buffer.push(msg);
      } else {
        if (buffer.length) grouped.push(buffer), buffer = [];
        grouped.push([msg]);
      }
    }
    if (buffer.length) grouped.push(buffer);
    return (
      <div className="message-list" ref={ref}>
        {grouped.map((group, index) => {
          // 客户端提示消息单独渲染
          if (group.length === 1 && group[0].role === 'client-notice') {
            const notice = group[0];
            return (
              <ClientNoticeCard
                key={notice.id}
                content={notice.content}
                noticeType={notice.noticeType}
                errorCode={notice.errorCode}
                timestamp={notice.timestamp}
              />
            );
          }
          // assistant/tool 组合渲染
          const messagesWithChatId = group.map(msg => ({
            ...msg,
            chatId: currentChatId || '',
          }));
          
          // 只有最后一个 MessageCard 显示状态
          const isLastGroup = index === grouped.length - 1;
          const shouldShowStatus = isLastGroup && (
            group.some(msg => msg.role === 'assistant' || msg.role === 'tool')
          );
          
          return (
            <MessageCard 
              key={group.map(m=>m.id).join('-')} 
              messages={messagesWithChatId}
              cardStatus={shouldShowStatus ? messageCardStatus : 'stable'}
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
