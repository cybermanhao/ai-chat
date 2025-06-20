import React, { useState, useMemo } from 'react';
import { UserOutlined, RobotOutlined, DownOutlined, RightOutlined, LoadingOutlined, FormOutlined, CopyOutlined } from '@ant-design/icons';
import type { ChatRole } from '@/types';
import { Button, Tooltip, message } from 'antd';
import { markdownToHtml, copyToClipboard } from '@/utils/markdown';
import './styles.less';

export type MessageStatus = 'connecting' | 'thinking' | 'answering' | 'stable';

interface MessageCardProps {
  id: string;
  content: string;
  role: ChatRole;
  reasoning_content?: string;
  status: MessageStatus;
}

const MessageCard: React.FC<MessageCardProps> = ({ 
  content, 
  role, 
  reasoning_content,
  status = 'stable'
}) => {
  const [showReasoning, setShowReasoning] = useState(true);
  const [useMarkdown, setUseMarkdown] = useState(true);
  
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';
  const hasReasoning = isAssistant && reasoning_content;
  const isStreaming = status !== 'stable';  const isThinking = status === 'thinking';
  const renderedContent = useMemo(() => {
    if (!content) return '';
    return useMarkdown ? markdownToHtml(content) : content;
  }, [content, useMarkdown]);

  const renderStatus = () => {
    if (isUser || status === 'stable') return null;

  const statusMap = {
      connecting: { text: '连接中...', icon: <LoadingOutlined />, className: 'status-connecting' },
      thinking: { text: '思考中...', icon: <LoadingOutlined />, className: 'status-thinking' },
      answering: { text: '回答中...', icon: <LoadingOutlined />, className: 'status-answering' }
    };

    const statusInfo = statusMap[status];
    if (!statusInfo) return null;    return (
      <div className={`message-status ${statusInfo.className || ''}`}>
        {statusInfo.icon} <span>{statusInfo.text}</span>
      </div>
    );
  };

  return (
    <div className={`message-card ${isUser ? 'message-user' : 'message-assistant'} status-${status}`}>
      <div className="message-inner">
        <div className="message-avatar">
          {isUser ? <UserOutlined /> : <RobotOutlined />}
        </div>
        <div className="message-body">
          {renderStatus()}
          {hasReasoning && (
            <div className="reasoning-section">
              <div className="reasoning-header" onClick={() => setShowReasoning(!showReasoning)}>
                {showReasoning ? <DownOutlined /> : <RightOutlined />}
                <span>思考过程</span>
              </div>
              {showReasoning && (
                <pre className="reasoning-content">
                  {reasoning_content}
                </pre>
              )}
            </div>
          )}
          {!isThinking && (
            <div className="message-content">
              {!isUser && (
                <div className="message-content-header">
                  <Tooltip title={useMarkdown ? "关闭 Markdown 渲染" : "开启 Markdown 渲染"}>
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<FormOutlined />} 
                      onClick={() => setUseMarkdown(!useMarkdown)}
                      className={`markdown-toggle ${useMarkdown ? 'active' : ''}`}
                    />
                  </Tooltip>
                  <Tooltip title="复制内容">
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        copyToClipboard(content);
                        message.success({ 
                          content: '已复制到剪贴板',
                          className: 'copy-success-message'
                        });
                      }}
                      className="copy-button"
                    />
                  </Tooltip>
                </div>
              )}              <div 
                className={`message-content-body ${useMarkdown ? "markdown-content" : "plain-text"}`}
                dangerouslySetInnerHTML={{ 
                  __html: renderedContent + (isStreaming ? '<span class="typing-cursor"></span>' : '') 
                }}
              />
              {isStreaming && <span className="typing-cursor" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageCard;
