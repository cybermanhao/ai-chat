import React, { useMemo } from 'react';
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
    // 支持直接用 redux state
    const currentChatId = useSelector((state: RootState) => state.chat.currentChatId);
    const rawMessages = useSelector((state: RootState) => 
      state.chat.chatData[currentChatId || '']?.messages || EMPTY_ARRAY
    );
    
    // 使用 useMemo 缓存处理后的消息，避免不必要的重渲染
    const processedMessages = useMemo(() => {
      return rawMessages.map((msg: any, idx: number) => ({
        ...msg,
        id: msg.id || `msg-${idx}`,
        timestamp: msg.timestamp || Date.now() + idx,
      }));
    }, [rawMessages]);
    
    // 直接用 EnrichedMessage
    const list: EnrichedMessage[] = (messages ?? processedMessages);
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
        {grouped.map((group) => {
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
          return <MessageCard key={group.map(m=>m.id).join('-')} messages={messagesWithChatId} />;
        })}
        {activeChatRef && <div ref={activeChatRef} style={{ height: 1 }} />}
      </div>
    );
  }
);

MessageList.displayName = 'MessageList';

export default MessageList;
