import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { DownOutlined, RightOutlined, LoadingOutlined, FormOutlined, CopyOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { MessageRole, MessageStatus } from '@engine/types/chat';
import { Button, Tooltip } from 'antd';
import { markdownToHtml, copyToClipboard } from '@/utils/markdown';
import AvatarIcon from '@/components/AvatarIcon';
import type { RootState } from '@/store';
import './styles.less';

interface MessageCardProps {
  id: string;
  chatId: string;
  content: string;
  role: MessageRole;
  reasoning_content?: string;
  tool_content?: string;
  observation_content?: string;
  thought_content?: string;
  status?: MessageStatus;
  isGenerating?: boolean;
  noticeType?: 'error' | 'warning' | 'info';
  errorCode?: string;
}

const MessageCard: React.FC<MessageCardProps> = ({ 
  id,
  chatId,
  content, 
  role, 
  reasoning_content,
  tool_content,
  observation_content,
  thought_content,
  status = 'stable',
  noticeType = 'info',
  errorCode
}) => {
  // 从 Redux state 中获取最新的消息状态
  const runtimeMessage = useSelector((state: RootState) => 
    state.chat.chatData[chatId]?.messages.find(m => m.id === id)
  );
  const [showReasoning, setShowReasoning] = useState(true);
  const [showToolOutput, setShowToolOutput] = useState(true);
  const [showThoughts, setShowThoughts] = useState(true);
  const [useMarkdown, setUseMarkdown] = useState(true);
  
  // Computed basic states
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';
  const isClientNotice = role === 'client-notice';
  // 直接使用 Redux 或 props 中的状态
  const currentStatus = runtimeMessage?.status || status;

  // Get runtime content from store or props
  const runtimeContent = runtimeMessage ? {
    reasoning_content: (runtimeMessage as { reasoning_content?: string }).reasoning_content,
    tool_content: (runtimeMessage as { tool_content?: string }).tool_content,
    observation_content: (runtimeMessage as { observation_content?: string }).observation_content,
    thought_content: (runtimeMessage as { thought_content?: string }).thought_content
  } : {};

  // Clean and filter content
  const cleanContent = (str?: string) => {
    if (!str) return '';
    return str.replace(/null/g, '').trim();
  };

  const currentReasoningContent = cleanContent(runtimeContent.reasoning_content || reasoning_content);
  const currentToolContent = cleanContent(runtimeContent.tool_content || tool_content);
  const currentObservationContent = cleanContent(runtimeContent.observation_content || observation_content);
  const currentThoughtContent = cleanContent(runtimeContent.thought_content || thought_content);

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
      tool_calling: {
        text: '工具调用中...',
        icon: <LoadingOutlined />,
        className: 'status-tool-calling'
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

    // 明确 statusMap 索引类型，消除隐式 any
    const statusInfo = statusMap[currentStatus as MessageStatus];
    if (!statusInfo) return null;

    return (
      <div className={`message-status ${statusInfo.className}`}>
        {statusInfo.icon} <span>{statusInfo.text}</span>
      </div>
    );
  };
  const roleClass = isUser ? 'message-user' : isClientNotice ? 'message-notice' : 'message-assistant';

  // 头像参数
  let avatarProps = {};
  if (isUser) {
    avatarProps = {
      provider: 'user',
      backgroundColor: '#e6f7ff',
      shape: 'circle',
      size: 36,
      src: undefined,
    };
  } else if (isAssistant) {
    avatarProps = {
      provider: 'chatgpt',
      backgroundColor: '#f6ffed',
      shape: 'circle',
      size: 36,
      src: undefined,
    };
  } else if (isClientNotice) {
    avatarProps = {
      provider: 'info',
      backgroundColor: '#fffbe6',
      shape: 'circle',
      size: 36,
      src: undefined,
    };
  }

  return (
    <div className={`message-card ${roleClass}`}>
      <div className="message-header">
        <AvatarIcon {...avatarProps} />
        <div className="message-status">
          {renderStatus()}
        </div>
      </div>
      <div className="message-content">
        {isAssistant && currentReasoningContent && (
          <div className="reasoning-section">
            <Button 
              type="text" 
              icon={showReasoning ? <DownOutlined /> : <RightOutlined />}
              onClick={() => setShowReasoning(!showReasoning)}
            >
              Reasoning
            </Button>
            {showReasoning && (
              <div className="reasoning-content">
                {currentReasoningContent}
              </div>
            )}
          </div>
        )}
        {isAssistant && (currentToolContent || currentObservationContent) && (
          <div className="tool-section">
            <Button 
              type="text" 
              icon={showToolOutput ? <DownOutlined /> : <RightOutlined />}
              onClick={() => setShowToolOutput(!showToolOutput)}
            >
              Tool Output
            </Button>
            {showToolOutput && (
              <>
                {currentToolContent && (
                  <div className="tool-content">
                    {useMarkdown ? (
                      <div className="markdown-body" dangerouslySetInnerHTML={{ __html: markdownToHtml(currentToolContent) }} />
                    ) : (
                      currentToolContent
                    )}
                  </div>
                )}
                {currentObservationContent && (
                  <div className="observation-content">
                    {useMarkdown ? (
                      <div className="markdown-body" dangerouslySetInnerHTML={{ __html: markdownToHtml(currentObservationContent) }} />
                    ) : (
                      currentObservationContent
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {isAssistant && currentThoughtContent && (
          <div className="thought-section">
            <Button 
              type="text" 
              icon={showThoughts ? <DownOutlined /> : <RightOutlined />}
              onClick={() => setShowThoughts(!showThoughts)}
            >
              Thoughts
            </Button>
            {showThoughts && (
              <div className="thought-content">
                {useMarkdown ? (
                  <div className="markdown-body" dangerouslySetInnerHTML={{ __html: markdownToHtml(currentThoughtContent) }} />
                ) : (
                  currentThoughtContent
                )}
              </div>
            )}
          </div>
        )}
        <div className="main-content">
          {isClientNotice ? (
            <div className={`notice-content ${noticeType}`}>
              {content}
              {errorCode && <div className="error-code">{errorCode}</div>}
            </div>
          ) : useMarkdown ? (
            <div className="markdown-body" dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />
          ) : (
            content
          )}
        </div>
      </div>
      {isAssistant && (
        <div className="message-actions">
          <Tooltip title="Copy">
            <Button 
              type="text" 
              icon={<CopyOutlined />} 
              onClick={() => copyToClipboard(content)}
            />
          </Tooltip>
          <Tooltip title="Toggle Markdown">
            <Button 
              type="text" 
              icon={<FormOutlined />}
              onClick={() => setUseMarkdown(!useMarkdown)} 
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default MessageCard;
