import React, { useState, useMemo } from 'react';
import { UserOutlined, RobotOutlined, DownOutlined, RightOutlined, LoadingOutlined, FormOutlined, CopyOutlined, InfoCircleOutlined, WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ChatCompletionRole } from 'openai/resources/chat/completions';
import type { MessageRole } from '@/types/chat';
import { Button, Tooltip, message } from 'antd';
import { markdownToHtml, copyToClipboard } from '@/utils/markdown';
import { useChatRuntimeStore } from '@/store/chatRuntimeStore';
import './styles.less';

export type MessageStatus = 'connecting' | 'thinking' | 'generating' | 'stable' | 'done' | 'error';

interface MessageCardProps {
  id: string;
  content: string;
  role: MessageRole;
  reasoning_content?: string;
  status?: MessageStatus;
  isGenerating?: boolean;
  noticeType?: 'error' | 'warning' | 'info';
  errorCode?: string;
}

const MessageCard: React.FC<MessageCardProps> = ({ 
  id,
  content, 
  role, 
  reasoning_content,
  status = 'stable',
  isGenerating = false,
  noticeType = 'info',
  errorCode
}) => {
  const runtimeMessage = useChatRuntimeStore(state => state.runtimeMessages[id]);
  const [showReasoning, setShowReasoning] = useState(true);
  const [useMarkdown, setUseMarkdown] = useState(true);
  
  // Computed
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';
  const isClientNotice = role === 'client-notice';
  const hasReasoning = isAssistant && reasoning_content;
  const currentStatus = runtimeMessage?.status || status;
  const isStreaming = currentStatus === 'generating' && isGenerating;
  const isThinking = currentStatus === 'thinking';
  
  // Memoized content
  const renderedContent = useMemo(() => {
    if (!content && !isStreaming) return '';
    const processed = useMarkdown ? markdownToHtml(content || '') : content;
    return processed || (isStreaming ? ' ' : '');
  }, [content, useMarkdown, isStreaming]);

  // Status rendering
  const renderStatus = () => {
    if (isUser || currentStatus === 'stable' || currentStatus === 'done') return null;
      const statusMap: Record<MessageStatus, { text: string; icon: React.ReactNode; className: string }> = {
      connecting: { 
        text: '连接中...', 
        icon: <LoadingOutlined />, 
        className: 'status-connecting' 
      },
      thinking: { 
        text: '思考中...', 
        icon: <LoadingOutlined />, 
        className: 'status-thinking' 
      },
      generating: { 
        text: '生成中...', 
        icon: <LoadingOutlined />, 
        className: 'status-generating' 
      },
      stable: {
        text: '',
        icon: <></>,
        className: ''
      },
      done: {
        text: '',
        icon: <></>,
        className: ''
      },
      error: {
        text: '出错了',
        icon: <ExclamationCircleOutlined />,
        className: 'status-error'
      }
    };

    const statusInfo = statusMap[currentStatus];
    if (!statusInfo) return null;

    return (
      <div className={`message-status ${statusInfo.className}`}>
        {statusInfo.icon} <span>{statusInfo.text}</span>
      </div>
    );
  };
  // Get notice icon based on type
  const getNoticeIcon = () => {
    if (!isClientNotice) return null;
    
    switch (noticeType) {
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'info':
      default:
        return <InfoCircleOutlined style={{ color: '#1677ff' }} />;
    }
  };

  return (    <div 
      className={`message-card ${isUser ? 'message-user' : isClientNotice ? 'message-notice' : 'message-assistant'} status-${currentStatus} ${isClientNotice ? `notice-${noticeType}` : ''}`}
    >
      <div className="message-inner">
        <div className="message-avatar">
          {isUser ? <UserOutlined /> : isClientNotice ? getNoticeIcon() : <RobotOutlined />}
        </div>
        <div className="message-body">
          {renderStatus()}
          {hasReasoning && (
            <div className="reasoning-section">
              <div 
                className="reasoning-header" 
                onClick={() => setShowReasoning(!showReasoning)}
              >
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
              )}
              <div 
                className={`message-content-body ${useMarkdown ? "markdown-content" : "plain-text"}`}
                dangerouslySetInnerHTML={{ 
                  __html: renderedContent
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
