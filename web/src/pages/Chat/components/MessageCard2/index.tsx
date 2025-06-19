import React, { useState } from 'react';
import { UserOutlined, RobotOutlined, DownOutlined, RightOutlined, LoadingOutlined } from '@ant-design/icons';
import type { ChatRole } from '@/types';
import './styles.less';

export type MessageStatus = 'connecting' | 'thinking' | 'answering' | 'stable';

interface MessageCard2Props {
  id: string;
  content: string;
  role: ChatRole;
  reasoning_content?: string;
  status: MessageStatus;
}

const MessageCard2: React.FC<MessageCard2Props> = ({ 
  content, 
  role, 
  reasoning_content,
  status 
}) => {
  const [showReasoning, setShowReasoning] = useState(true);
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';
  const hasReasoning = isAssistant && reasoning_content;
  const isStreaming = status !== 'stable';

  const toggleReasoning = () => {
    setShowReasoning(!showReasoning);
  };

  const renderStatus = () => {
    if (isUser || status === 'stable') return null;

    const statusMap = {
      connecting: { text: '连接中...', icon: <LoadingOutlined /> },
      thinking: { text: '思考中...', icon: <LoadingOutlined /> },
      answering: { text: '回答中...', icon: <LoadingOutlined /> }
    };

    const statusInfo = statusMap[status];
    if (!statusInfo) return null;

    return (
      <div className="message-status">
        {statusInfo.icon} <span>{statusInfo.text}</span>
      </div>
    );
  };

  return (
    <div className={`message-card2 ${isUser ? 'message-user' : 'message-assistant'} status-${status}`}>
      <div className="message-inner">
        <div className="message-avatar">
          {isUser ? <UserOutlined /> : <RobotOutlined />}
        </div>
        <div className="message-body">
          {renderStatus()}
          {hasReasoning && (
            <div className="reasoning-section">
              <div className="reasoning-header" onClick={toggleReasoning}>
                {showReasoning ? <DownOutlined /> : <RightOutlined />}
                <span>思考过程</span>
              </div>
              {showReasoning && (
                <div className="reasoning-content">
                  {reasoning_content}
                </div>
              )}
            </div>
          )}
          <div className="message-content">
            {content}
            {isStreaming && <span className="typing-cursor" />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageCard2;
