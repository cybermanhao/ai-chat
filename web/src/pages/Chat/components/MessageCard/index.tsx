import React, { useState } from 'react';
import { LoadingOutlined, DownOutlined, RightOutlined, EyeOutlined, EyeInvisibleOutlined, CopyOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';
import type { MessageRole } from '@engine/types/chat';
import { markdownToHtml } from '@engine/utils/markdown';

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
  // 状态管理
  const [collapsedReasoning, setCollapsedReasoning] = useState<Record<string, boolean>>({});
  const [markdownEnabled, setMarkdownEnabled] = useState<Record<string, boolean>>({});

  // 复制功能
  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      message.success('已复制到剪贴板');
    } catch (err) {
      message.error('复制失败');
    }
  };

  // 切换思考过程展开/折叠
  const toggleReasoning = (messageId: string) => {
    setCollapsedReasoning(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  // 切换 Markdown 渲染
  const toggleMarkdown = (messageId: string) => {
    setMarkdownEnabled(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  // 调试：检查 reasoning_content 数据
  React.useEffect(() => {
    const msgWithReasoning = messages.find(msg => msg.reasoning_content);
    if (msgWithReasoning) {
      console.log('[MessageCard] 检测到 reasoning_content:', {
        messageId: msgWithReasoning.id,
        reasoning_length: msgWithReasoning.reasoning_content?.length,
        reasoning_preview: msgWithReasoning.reasoning_content?.substring(0, 100),
        role: msgWithReasoning.role
      });
    }
  }, [messages]);

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
          avatarProps = { provider: 'deepseek', backgroundColor: '#e6f7ff', shape: 'circle', size: 32 };
        } else if (isAssistant) {
          avatarProps = { provider: 'chatgpt', backgroundColor: '#f6ffed', shape: 'circle', size: 32 };
        } else if (isTool) {
          avatarProps = { provider: 'chatgpt', backgroundColor: '#fffbe6', shape: 'circle', size: 32 };
        } else if (isClientNotice) {
          avatarProps = { provider: 'deepseek', backgroundColor: '#fffbe6', shape: 'circle', size: 32 };
        }
        // 渲染每条消息
        return (
          <div className={`message-card ${isUser ? 'message-user' : isAssistant ? 'message-assistant' : isTool ? 'message-tool' : 'message-notice'}`} key={msg.id}>
            <div className="message-header">
              <AvatarIcon {...avatarProps} />
            </div>
            <div className="message-content">
              {/* reasoning_content 渲染：思考过程，在主内容之前显示 */}
              {(isAssistant || msg.role === 'assistant') && msg.reasoning_content && (
                <div className="reasoning-section">
                  <div 
                    className="reasoning-header"
                    onClick={() => toggleReasoning(msg.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    {collapsedReasoning[msg.id] ? <RightOutlined /> : <DownOutlined />}
                    💭 思考过程
                  </div>
                  {!collapsedReasoning[msg.id] && (
                    <div 
                      className="reasoning-content"
                      dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.reasoning_content) }}
                    />
                  )}
                </div>
              )}
              
              {/* tool 内容渲染 */}
              {isTool && msg.content && (
                <div className="tool-section">
                  <div 
                    className="tool-content"
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }}
                  />
                </div>
              )}
              
              {/* 主内容渲染 - 带控制按钮 */}
              {msg.content && (
                <div className="main-content-container">
                  {/* 控制按钮（仅对 assistant 消息显示） */}
                  {isAssistant && (
                    <div className="message-content-header">
                      <Button
                        type="text"
                        size="small"
                        icon={markdownEnabled[msg.id] ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                        onClick={() => toggleMarkdown(msg.id)}
                        title={markdownEnabled[msg.id] ? '关闭 Markdown 渲染' : '开启 Markdown 渲染'}
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopy(msg.content)}
                        title="复制内容"
                      />
                    </div>
                  )}
                  
                  {/* 内容区域 */}
                  {isUser || isClientNotice ? (
                    <div className="main-content">{msg.content}</div>
                  ) : (
                    <div className="main-content">
                      {markdownEnabled[msg.id] ? (
                        <div 
                          className="markdown-content"
                          dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }}
                        />
                      ) : (
                        <div className="plain-text">{msg.content}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageCard;
