import React, { useState } from 'react';
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
  status 
}) => {
  const [showReasoning, setShowReasoning] = useState(true);
  const [useMarkdown, setUseMarkdown] = useState(true);
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';
  const hasReasoning = isAssistant && reasoning_content;
  const isStreaming = status !== 'stable';

  const toggleReasoning = () => {
    setShowReasoning(!showReasoning);
  };

  const toggleMarkdown = () => {
    setUseMarkdown(!useMarkdown);
  };

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      message.success({
        content: '已复制到剪贴板',
        duration: 1,
        className: 'copy-success-message'
      });
    } else {
      message.error({
        content: '复制失败',
        duration: 2
      });
    }
  };

  const renderMarkdownContent = (mdContent: string) => {
    if (!mdContent) return '';
    return useMarkdown ? markdownToHtml(mdContent) : mdContent;
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

  const renderedContent = renderMarkdownContent(content);

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
              <div className="reasoning-header" onClick={toggleReasoning}>
                {showReasoning ? <DownOutlined /> : <RightOutlined />}
                <span>思考过程</span>
              </div>
              {showReasoning && (
                <pre className="reasoning-content">
                  {reasoning_content}
                </pre>
              )}
            </div>
          )}          {status !== 'thinking' && (
            <div className="message-content">
              {!isUser && (
                <div className="message-content-header">
                  <Tooltip title={useMarkdown ? "关闭 Markdown 渲染" : "开启 Markdown 渲染"}>
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<FormOutlined />} 
                      onClick={toggleMarkdown}
                      className={`markdown-toggle ${useMarkdown ? 'active' : ''}`}
                    />
                  </Tooltip>
                  <Tooltip title="复制内容">
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopy(useMarkdown ? content : renderedContent)}
                      className="copy-button"
                    />
                  </Tooltip>
                </div>
              )}
              <div 
                className={useMarkdown ? "markdown-content" : "plain-text"}
                dangerouslySetInnerHTML={{ __html: renderedContent }}
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
