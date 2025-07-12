import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { LoadingOutlined, DownOutlined, RightOutlined, EyeOutlined, EyeInvisibleOutlined, CopyOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';
import type { MessageRole, UserMessage, AssistantMessage, ToolMessage, ClientNoticeMessage } from '@engine/types/chat';
import type { ToolCall } from '@engine/stream/streamHandler';
import { markdownToHtml } from '@engine/utils/markdown';
import type { RootState } from '@/store';

import AvatarIcon from '@/components/AvatarIcon';
import ToolCallCard from '../ToolCallCard';

import './styles.less';

import type { IMessageCardStatus } from '@engine/types/chat';

// ============================================================================
// 扩展消息类型（用于向后兼容和调试功能）
// ============================================================================
interface ExtendedUserMessage extends UserMessage {
  id: string;
  chatId?: string;
  timestamp?: number;
}

interface ExtendedAssistantMessage extends AssistantMessage {
  id: string;
  chatId?: string;
  timestamp?: number;
  // tool_calls 已在 AssistantMessage 中定义为 ChatCompletionMessageToolCall[]
}

interface ExtendedToolMessage extends ToolMessage {
  id: string;
  chatId?: string;
  timestamp?: number;
  toolName?: string;
  toolArguments?: string;
  toolStatus?: 'calling' | 'success' | 'error';
  // 调试配置（Debug模式专用）
  debugConfig?: {
    autoStatusChange?: {
      delay: number;
      finalStatus: 'success' | 'error';
      finalContent: string;
    };
    animationPhase?: number;
    useBackgroundPulse?: boolean;
  };
  // 兼容旧版的调试参数（将逐步移除）
  autoStatusChange?: {
    delay: number;
    finalStatus: 'success' | 'error';
    finalContent: string;
  };
  animationPhase?: number;
  useBackgroundPulse?: boolean;
}

interface ExtendedClientNoticeMessage extends ClientNoticeMessage {
  id: string;
  chatId?: string;
  timestamp?: number;
}

// ============================================================================
// 向后兼容的消息类型（包含所有可能的扩展属性）
// ============================================================================
interface LegacyMessage {
  id: string;
  chatId?: string;
  timestamp?: number;
  content: string;
  role: MessageRole;
  status?: string;
  reasoning_content?: string;
  tool_content?: string;
  observation_content?: string;
  thought_content?: string;
  noticeType?: 'error' | 'warning' | 'info';
  errorCode?: string;
  tool_calls?: ToolCall[];
  toolName?: string;
  toolArguments?: string;
  toolStatus?: 'calling' | 'success' | 'error';
  debugConfig?: {
    autoStatusChange?: {
      delay: number;
      finalStatus: 'success' | 'error';
      finalContent: string;
    };
    animationPhase?: number;
    useBackgroundPulse?: boolean;
  };
  autoStatusChange?: {
    delay: number;
    finalStatus: 'success' | 'error';
    finalContent: string;
  };
  animationPhase?: number;
  useBackgroundPulse?: boolean;
}

// ============================================================================
// 消息联合类型
// ============================================================================
type Message = ExtendedUserMessage | ExtendedAssistantMessage | ExtendedToolMessage | ExtendedClientNoticeMessage | LegacyMessage;

// ============================================================================
// 类型守卫函数
// ============================================================================
const isAssistantMessage = (msg: Message): msg is ExtendedAssistantMessage => msg.role === 'assistant';
const isToolMessage = (msg: Message): msg is ExtendedToolMessage => msg.role === 'tool';
const isClientNoticeMessage = (msg: Message): msg is ExtendedClientNoticeMessage => msg.role === 'client-notice';
const isLegacyMessage = (msg: Message): msg is LegacyMessage => {
  return 'reasoning_content' in msg || 'tool_content' in msg || 'observation_content' in msg || 'thought_content' in msg;
};

// ============================================================================
// MessageCard 组件 Props
// ============================================================================
interface MessageCardProps {
  // 支持组合渲染：可传入一组消息（如 assistant+tool），也可单条
  messages: Message[];
  cardStatus?: IMessageCardStatus; // 新增：由外部传入流程状态
  chatId: string; // 新增：聊天ID，用于获取工具调用状态
}

const statusMap: Record<IMessageCardStatus, { text: string; icon: React.ReactNode; className: string }> = {
  connecting: { text: '连接中...', icon: <LoadingOutlined />, className: 'status-connecting' },
  thinking: { text: '思考中...', icon: <LoadingOutlined />, className: 'status-thinking' },
  generating: { text: '生成中...', icon: <LoadingOutlined />, className: 'status-generating' },
  tool_calling: { text: '工具调用中...', icon: <LoadingOutlined />, className: 'status-tool-calling' },
  stable: { text: '', icon: <></>, className: '' },
};

const MessageCard: React.FC<MessageCardProps> = ({ messages, cardStatus = 'stable', chatId }) => {
  // 从 Redux 获取工具调用状态
  const toolCallStates = useSelector((state: RootState) => state.chat.toolCallStates[chatId] || {});
  
  // 状态管理
  const [collapsedReasoning, setCollapsedReasoning] = useState<Record<string, boolean>>({});
  // 默认开启 Markdown 渲染
  const [markdownEnabled, setMarkdownEnabled] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    messages.forEach(msg => {
      if (msg.role === 'assistant' || msg.role === 'tool') {
        initialState[msg.id] = true; // 默认开启 Markdown 渲染
      }
    });
    return initialState;
  });

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
    const msgWithReasoning = messages.find(msg => 
      (isAssistantMessage(msg) || isLegacyMessage(msg)) && 'reasoning_content' in msg && msg.reasoning_content
    );
    if (msgWithReasoning && 'reasoning_content' in msgWithReasoning) {
      // console.log('[MessageCard] 检测到 reasoning_content:', {
      //   messageId: msgWithReasoning.id,
      //   reasoning_length: msgWithReasoning.reasoning_content?.length,
      //   reasoning_preview: msgWithReasoning.reasoning_content?.substring(0, 100),
      //   role: msgWithReasoning.role
      // });
    }
  }, [messages]);

  // 确保新消息也默认开启 Markdown 渲染
  React.useEffect(() => {
    setMarkdownEnabled(prev => {
      const newState = { ...prev };
      messages.forEach(msg => {
        if ((msg.role === 'assistant' || msg.role === 'tool') && !(msg.id in newState)) {
          newState[msg.id] = true; // 新消息默认开启 Markdown 渲染
        }
      });
      return newState;
    });
  }, [messages]);

  // 确定组的主要角色（以第一个非user消息为准）
  const groupMainRole = messages.find(msg => msg.role !== 'user')?.role || messages[0]?.role || 'assistant';
  const isGroupUser = groupMainRole === 'user';
  const isGroupAssistant = groupMainRole === 'assistant';
  const isGroupTool = groupMainRole === 'tool';
  
  // 统一的头像参数（基于组的主要角色）
  let groupAvatarProps = {};
  if (isGroupUser) {
    groupAvatarProps = { provider: 'user', backgroundColor: '#e6f7ff', shape: 'circle', size: 32 };
  } else if (isGroupAssistant) {
    groupAvatarProps = { provider: 'deepseek', backgroundColor: '#f6ffed', shape: 'circle', size: 32 };
  } else if (isGroupTool) {
    groupAvatarProps = { provider: 'chatgpt', backgroundColor: '#fffbe6', shape: 'circle', size: 32 };
  } else {
    groupAvatarProps = { provider: 'deepseek', backgroundColor: '#fffbe6', shape: 'circle', size: 32 };
  }

  // 安全获取通知类型
  const getNoticeType = (msg: Message) => {
    if (isClientNoticeMessage(msg)) {
      return msg.noticeType;
    }
    if (isLegacyMessage(msg) && msg.noticeType) {
      return msg.noticeType;
    }
    return 'info';
  };

  return (
    <div className={`message-card-group ${isGroupUser ? 'group-user' : isGroupAssistant ? 'group-assistant' : isGroupTool ? 'group-tool' : 'group-notice'}`}>
      {/* 状态栏 */}
      <div className="message-status-bar">
        {cardStatus !== 'stable' && (
          <div className={`message-status ${statusMap[cardStatus].className}`}>
            {statusMap[cardStatus].icon} <span>{statusMap[cardStatus].text}</span>
          </div>
        )}
      </div>
      
      {/* 统一的卡片容器 */}
      <div className="unified-message-card">
        {/* 统一的头像 */}
        <div className="message-header">
          <AvatarIcon {...groupAvatarProps} />
          {/* 右上角操作按钮 */}
          {messages.some(msg => msg.role === 'assistant') && (
            <div className="message-card-actions">
              {/* 只对每条 assistant 消息分别控制按钮状态 */}
              {messages.filter(msg => msg.role === 'assistant').map(msg => (
                <React.Fragment key={msg.id}>
                  <Button
                    type="text"
                    size="small"
                    icon={markdownEnabled[msg.id] ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    onClick={() => toggleMarkdown(msg.id)}
                    title={markdownEnabled[msg.id] ? '关闭 Markdown 渲染' : '开启 Markdown 渲染'}
                    style={{ marginRight: 4 }}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(msg.content)}
                    title="复制内容"
                  />
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
        
        {/* 消息内容容器 */}
        <div className={`message-content-wrapper ${messages.some(msg => msg.role === 'client-notice') ? `notice-${getNoticeType(messages.find(msg => msg.role === 'client-notice')!)}` : ''}`}>
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isAssistant = msg.role === 'assistant';
            const isTool = msg.role === 'tool';
            const isClientNotice = msg.role === 'client-notice';
            const isLastMessage = index === messages.length - 1;
            
            // 渲染每条消息的内容（不含头像）
            return (
              <div key={msg.id} className={`message-content-item ${msg.role}`}>
                {/* reasoning_content 渲染：思考过程，在主内容之前显示 */}
                {(isAssistant || (isLegacyMessage(msg) && msg.reasoning_content)) && (
                  (() => {
                    const reasoningContent = (isAssistantMessage(msg) && msg.reasoning_content) || 
                                           (isLegacyMessage(msg) && msg.reasoning_content);
                    return reasoningContent ? (
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
                            dangerouslySetInnerHTML={{ __html: markdownToHtml(reasoningContent) }}
                          />
                        )}
                      </div>
                    ) : null;
                  })()
                )}
                
                {/* Assistant 消息中的工具调用 - 只在调用进行中时显示 */}
                {isAssistant && (
                  (() => {
                    const toolCalls = (isAssistantMessage(msg) && msg.tool_calls) || 
                                     (isLegacyMessage(msg) && msg.tool_calls);
                    return toolCalls && toolCalls.length > 0 ? (
                      <div className="assistant-tool-calls">
                        {toolCalls.map((toolCall, toolIndex) => {
                          // 从 Redux 获取工具调用状态
                          const toolCallState = toolCallStates[toolCall.id || `${msg.id}_${toolIndex}`];
                          const status = toolCallState?.status || 'calling';
                          const result = toolCallState?.result || '';
                          const error = toolCallState?.error;
                          
                          // 只在工具调用进行中时显示，调用完成后不显示（由 tool 消息显示结果）
                          // 新增：如果没有对应的工具调用状态，说明可能是历史消息，也不显示
                          if (status === 'success' || status === 'error' || !toolCallState) {
                            return null;
                          }
                          
                          return (
                            <ToolCallCard
                              key={`${msg.id}_tool_${toolIndex}`}
                              id={`assistant_tool_${msg.id}_${toolIndex}`}
                              toolName={toolCall.function?.name || '未知工具'}
                              content={
                                status === 'calling' 
                                  ? '正在调用工具...' 
                                  : status === 'error' 
                                    ? error || '调用失败'
                                    : result || '调用完成'
                              }
                              toolArguments={toolCall.function?.arguments || ''}
                              status={status}
                              collapsed={true}
                            />
                          );
                        })}
                      </div>
                    ) : null;
                  })()
                )}
                
                {/* tool 内容渲染 - 使用 ToolCallCard 组件 */}
                {isTool && msg.content && (
                  <ToolCallCard
                    key={`tool-card-${msg.id}`}
                    id={`tool_${msg.id}`} // 使用更稳定的ID格式
                    toolName={
                      (isToolMessage(msg) && msg.toolName) || 
                      (isLegacyMessage(msg) && msg.toolName) || 
                      '工具调用结果'
                    }
                    content={msg.content}
                    toolArguments={
                      ((isToolMessage(msg) && msg.toolArguments) || 
                       (isLegacyMessage(msg) && msg.toolArguments)) || undefined
                    }
                    status={
                      (isToolMessage(msg) && msg.toolStatus) || 
                      (isLegacyMessage(msg) && msg.toolStatus) || 
                      'success'
                    }
                    collapsed={true}
                    debugConfig={
                      (isToolMessage(msg) && msg.debugConfig) || 
                      (isLegacyMessage(msg) && msg.debugConfig) || 
                      (() => {
                        const autoStatusChange = (isToolMessage(msg) && msg.autoStatusChange) || 
                                                (isLegacyMessage(msg) && msg.autoStatusChange);
                        const animationPhase = (isToolMessage(msg) && msg.animationPhase) || 
                                              (isLegacyMessage(msg) && msg.animationPhase) || 0;
                        const useBackgroundPulse = (isToolMessage(msg) && msg.useBackgroundPulse) || 
                                                  (isLegacyMessage(msg) && msg.useBackgroundPulse) || false;
                        return {
                          autoStatusChange: autoStatusChange || undefined,
                          animationPhase,
                          useBackgroundPulse
                        };
                      })()
                    }
                  />
                )}
                
                {/* 主内容渲染 - 带控制按钮 */}
                {msg.content && !isTool && (
                  <div className="main-content-container">
                    {/* 内容区域 */}
                    {isUser || isClientNotice ? (
                      <div className="main-content">
                        <div className="markdown-content" dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }} />
                      </div>
                    ) : (
                      <div className="main-content">
                        {markdownEnabled[msg.id] ? (
                          <div className="markdown-content" dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }} />
                        ) : (
                          <div className="text-content">{msg.content}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 其他内容类型的渲染 */}
                {isLegacyMessage(msg) && msg.tool_content && (
                  <ToolCallCard
                    id={`${msg.id}_tool_content`}
                    toolName="工具内容"
                    content={msg.tool_content}
                    status="success"
                    collapsed={true}
                  />
                )}
                
                {isLegacyMessage(msg) && msg.observation_content && (
                  <div className="observation-section">
                    <div className="observation-header">👁️ 观察结果</div>
                    <div className="observation-content" dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.observation_content) }} />
                  </div>
                )}
                
                {isLegacyMessage(msg) && msg.thought_content && (
                  <div className="thought-section">
                    <div className="thought-header">🤔 思考内容</div>
                    <div className="thought-content" dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.thought_content) }} />
                  </div>
                )}

                {/* 消息分隔符 - 智能显示逻辑 */}
                {!isLastMessage && (
                  (() => {
                    // 获取下一条消息
                    const nextMessage = messages[index + 1];
                    
                    // 不显示分割线的情况：
                    // 1. assistant 消息后跟 tool 消息（它们是同一轮对话）
                    // 2. tool 消息是组内第一个消息（避免在组开头显示分割线）
                    // 3. 当前消息是 group 的第一个消息且为 tool 类型时，不显示分割线
                    
                    const isAssistantToTool = isAssistant && nextMessage?.role === 'tool';
                    const isFirstMessageInGroup = index === 0;
                    const isGroupStartingWithTool = isFirstMessageInGroup && isTool;
                    
                    const shouldHideSeparator = isAssistantToTool || isGroupStartingWithTool;
                    
                    return shouldHideSeparator ? null : (
                      <div className="message-separator">
                        <div className="separator-line"></div>
                        <div className="separator-dot"></div>
                      </div>
                    );
                  })()
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default React.memo(MessageCard, (prevProps, nextProps) => {
  // 自定义比较函数，避免不必要的重渲染
  if (prevProps.cardStatus !== nextProps.cardStatus) {
    return false;
  }
  
  if (prevProps.messages.length !== nextProps.messages.length) {
    return false;
  }
  
  // ============================================================================
  // 深度比较每个消息的关键属性，避免因对象引用变化导致的重渲染
  // ============================================================================
  for (let i = 0; i < prevProps.messages.length; i++) {
    const prevMsg = prevProps.messages[i];
    const nextMsg = nextProps.messages[i];
    
    // 比较基础属性
    if (prevMsg.id !== nextMsg.id || 
        prevMsg.content !== nextMsg.content ||
        prevMsg.role !== nextMsg.role ||
        prevMsg.chatId !== nextMsg.chatId ||
        prevMsg.timestamp !== nextMsg.timestamp) {
      return false;
    }
    
    // 比较Assistant消息的特殊属性
    if (isAssistantMessage(prevMsg) && isAssistantMessage(nextMsg)) {
      if (prevMsg.reasoning_content !== nextMsg.reasoning_content) {
        return false;
      }
      // 比较tool_calls数组
      const prevToolCalls = prevMsg.tool_calls || [];
      const nextToolCalls = nextMsg.tool_calls || [];
      if (prevToolCalls.length !== nextToolCalls.length) {
        return false;
      }
      for (let j = 0; j < prevToolCalls.length; j++) {
        if (JSON.stringify(prevToolCalls[j]) !== JSON.stringify(nextToolCalls[j])) {
          return false;
        }
      }
    }
    
    // 比较Tool消息的特殊属性
    if (isToolMessage(prevMsg) && isToolMessage(nextMsg)) {
      if (prevMsg.toolName !== nextMsg.toolName ||
          prevMsg.toolArguments !== nextMsg.toolArguments ||
          prevMsg.toolStatus !== nextMsg.toolStatus) {
        return false;
      }
      // 比较debugConfig
      if (JSON.stringify(prevMsg.debugConfig) !== JSON.stringify(nextMsg.debugConfig)) {
        return false;
      }
    }
    
    // 比较Legacy消息的扩展属性
    if (isLegacyMessage(prevMsg) && isLegacyMessage(nextMsg)) {
      if (prevMsg.reasoning_content !== nextMsg.reasoning_content ||
          prevMsg.tool_content !== nextMsg.tool_content ||
          prevMsg.observation_content !== nextMsg.observation_content ||
          prevMsg.thought_content !== nextMsg.thought_content ||
          prevMsg.toolName !== nextMsg.toolName ||
          prevMsg.toolArguments !== nextMsg.toolArguments ||
          prevMsg.toolStatus !== nextMsg.toolStatus) {
        return false;
      }
    }
    
    // 比较ClientNotice消息的特殊属性
    if (isClientNoticeMessage(prevMsg) && isClientNoticeMessage(nextMsg)) {
      if (prevMsg.noticeType !== nextMsg.noticeType ||
          prevMsg.errorCode !== nextMsg.errorCode) {
        return false;
      }
    }
  }
  
  return true;
});
