import React from 'react';
import { LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { MessageRole } from '@engine/types/chat';

import AvatarIcon from '@/components/AvatarIcon';

import './styles.less';

import type { IMessageCardStatus } from '@engine/types/chat';
interface MessageCardProps {
  // 支持组合渲染：可传入一组消息（如 assistant+tool），也可单条
  messages: Array<{
    id: string;
    chatId: string;
    content: string;
    role: MessageRole;
    reasoning_content?: string;
    tool_content?: string;
    observation_content?: string;
    thought_content?: string;
    status?: string; // 仅作为附加信息，不再决定 MessageCard 渲染状态
    noticeType?: 'error' | 'warning' | 'info';
    errorCode?: string;
  }>;
  cardStatus?: IMessageCardStatus; // 新增：由外部传入流程状态
}

const statusMap: Record<IMessageCardStatus, { text: string; icon: React.ReactNode; className: string }> = {
  connecting: { text: '连接中...', icon: <LoadingOutlined />, className: 'status-connecting' },
  thinking: { text: '思考中...', icon: <LoadingOutlined />, className: 'status-thinking' },
  generating: { text: '生成中...', icon: <LoadingOutlined />, className: 'status-generating' },
  tool_calling: { text: '工具调用中...', icon: <LoadingOutlined />, className: 'status-tool-calling' },
  stable: { text: '', icon: <></>, className: '' },
};

const MessageCard: React.FC<MessageCardProps> = ({ messages, cardStatus = 'stable' }) => {
  // 只读 props，不再自行决定状态
  return (
    <div className="message-card-group">
      <div className="message-status-bar">
        {cardStatus !== 'stable' && (
          <div className={`message-status ${statusMap[cardStatus].className}`}>
            {statusMap[cardStatus].icon} <span>{statusMap[cardStatus].text}</span>
          </div>
        )}
      </div>
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        const isAssistant = msg.role === 'assistant';
        const isTool = msg.role === 'tool';
        const isClientNotice = msg.role === 'client-notice';
        // 头像参数
        let avatarProps = {};
        if (isUser) {
          avatarProps = { provider: 'deepseek', backgroundColor: '#e6f7ff', shape: 'circle', size: 36 };
        } else if (isAssistant) {
          avatarProps = { provider: 'chatgpt', backgroundColor: '#f6ffed', shape: 'circle', size: 36 };
        } else if (isTool) {
          avatarProps = { provider: 'chatgpt', backgroundColor: '#fffbe6', shape: 'circle', size: 36 };
        } else if (isClientNotice) {
          avatarProps = { provider: 'deepseek', backgroundColor: '#fffbe6', shape: 'circle', size: 36 };
        }
        // 渲染每条消息
        return (
          <div className={`message-card ${isUser ? 'message-user' : isAssistant ? 'message-assistant' : isTool ? 'message-tool' : 'message-notice'}`} key={msg.id}>
            <div className="message-header">
              <AvatarIcon {...avatarProps} />
            </div>
            <div className="message-content">
              {/* assistant/tool/tool_call/observation/thought 渲染逻辑可按需扩展 */}
              {isAssistant && msg.reasoning_content && (
                <div className="reasoning-section">{msg.reasoning_content}</div>
              )}
              {isTool && msg.content && (
                <div className="tool-section">{msg.content}</div>
              )}
              {/* 其他内容渲染 */}
              <div className="main-content">{msg.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageCard;
