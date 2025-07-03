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
    
    // ============================================================================
    // 优化分组逻辑：确保稳定的 key 策略
    // ============================================================================
    const grouped: Array<{
      key: string;
      messages: EnrichedMessage[];
      isLastGroup: boolean;
    }> = React.useMemo(() => {
      const groups: EnrichedMessage[][] = [];
      let buffer: EnrichedMessage[] = [];
      
      for (const msg of list) {
        if (msg.role === 'assistant' || msg.role === 'tool') {
          buffer.push(msg);
        } else {
          if (buffer.length) groups.push(buffer), buffer = [];
          groups.push([msg]);
        }
      }
      if (buffer.length) groups.push(buffer);
      
      // 为每个分组生成稳定的 key
      return groups.map((group, index) => {
        // 使用第一个消息的 id 作为稳定的 key
        // 这样可以避免因分组变化导致的 key 改变
        const firstMessage = group[0];
        const key = firstMessage.id;
        
        return {
          key,
          messages: group,
          isLastGroup: index === groups.length - 1
        };
      });
    }, [list]);
    // ============================================================================
    // 预处理所有分组的消息 props，避免在渲染时重复创建
    // ============================================================================
    const processedGroups = React.useMemo(() => {
      return grouped.map(groupItem => {
        const { messages: group, isLastGroup } = groupItem;
        
        const messagesWithChatId = group.map(msg => ({
          ...msg,
          chatId: currentChatId || '',
        }));
        
        const shouldShowStatus = isLastGroup && (
          group.some(msg => msg.role === 'assistant' || msg.role === 'tool')
        );
        
        return {
          ...groupItem,
          messagesWithChatId,
          shouldShowStatus
        };
      });
    }, [grouped, currentChatId, messageCardStatus]);

    return (
      <div className="message-list" ref={ref}>
        {processedGroups.map((groupItem) => {
          const { key, messages: group, messagesWithChatId, shouldShowStatus } = groupItem;
          
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
          
          return (
            <MessageCard 
              key={key} // 使用稳定的 key
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
