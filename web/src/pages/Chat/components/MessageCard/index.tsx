import React, { useState } from 'react';
import { UserOutlined, RobotOutlined, DownOutlined, RightOutlined, LoadingOutlined, FormOutlined, CopyOutlined, InfoCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { MessageRole } from '@engine/types/chat';
import { Button, Tooltip } from 'antd';
import { markdownToHtml, copyToClipboard } from '@/utils/markdown';
import { useChatRuntimeStore } from '@engine/store/chatRuntimeStore';
import './styles.less';

export type MessageStatus = 'connecting' | 'thinking' | 'generating' | 'stable' | 'done' | 'error';

interface MessageCardProps {
  id: string;
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
  // 修正 useChatRuntimeStore 用法，直接使用 web 端 store，类型自动推断
  const runtimeMessage = useChatRuntimeStore((state: import('@/store/chatRuntimeStore').ChatRuntimeState) => state.runtimeMessages[id]);
  const [showReasoning, setShowReasoning] = useState(true);
  const [showToolOutput, setShowToolOutput] = useState(true);
  const [showThoughts, setShowThoughts] = useState(true);
  const [useMarkdown, setUseMarkdown] = useState(true);
  
  // Computed basic states
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';
  const isClientNotice = role === 'client-notice';
  // 修正 status 取值，避免根状态类型报错
  const currentStatus = runtimeMessage && 'status' in runtimeMessage ? runtimeMessage.status : status;

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  return (
    <div className={`message-card ${roleClass}`}>
      <div className="message-header">
        {isUser ? <UserOutlined /> : isAssistant ? <RobotOutlined /> : <InfoCircleOutlined />}
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
                {useMarkdown ? (
                  <div className="markdown-body" dangerouslySetInnerHTML={{ __html: markdownToHtml(currentReasoningContent) }} />
                ) : (
                  currentReasoningContent
                )}
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
