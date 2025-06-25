// 引入 openai tool call 类型（如需多端适配可用自定义类型或类型导出）
import type { ChatCompletionMessageToolCall } from 'openai/resources/chat/completions';

// 基础消息类型
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool' | 'client-notice';

// 运行时消息状态
export type MessageStatus = 'connecting' | 'thinking' | 'generating' | 'stable' | 'done' | 'error';

// 基础消息共同属性
export type BaseMessage = {
  id: string;
  timestamp: number;
  content: string;
  status?: MessageStatus;
  name?: string;
};

// 系统消息
export type SystemMessage = BaseMessage & {
  role: 'system';
};

// 用户消息
export type UserMessage = BaseMessage & {
  role: 'user';
};

// 助手消息
export type AssistantMessage = BaseMessage & {
  role: 'assistant';
  reasoning_content?: string;
  tool_content?: string;
  observation_content?: string;
  thought_content?: string;
  tool_calls?: Array<ChatCompletionMessageToolCall>;
};

// 工具消息
export type ToolMessage = BaseMessage & {
  role: 'tool';
  tool_call_id: string;
};

// 客户端提示消息（用于错误提示，不会发送给模型）
export type ClientNoticeMessage = BaseMessage & {
  role: 'client-notice';
  noticeType: 'error' | 'warning' | 'info';
  errorCode?: string;
  status: MessageStatus;
};

// 聊天消息联合类型
export type ChatMessage = SystemMessage | UserMessage | AssistantMessage | ToolMessage | ClientNoticeMessage;

// 类型声明
export interface ToolCallContent { name: string; arguments?: string; }

// 流式响应块
export interface StreamChunk {
  content: string;
  reasoning_content?: string;
  tool_content?: string | ToolCallContent;
  observation_content?: string;
  thought_content?: string;
  error?: string;
  status?: MessageStatus;
  tool_calls?: Array<{ function?: { name?: string; arguments?: string } }>;

}

// 运行时消息（包括所有类型的消息，且必须有status属性）
export type RuntimeMessage = 
  | (SystemMessage & { status: MessageStatus }) 
  | (UserMessage & { status: MessageStatus })
  | (AssistantMessage & { status: MessageStatus }) 
  | (ToolMessage & { status: MessageStatus })
  | ClientNoticeMessage; // ClientNoticeMessage已经包含了status属性

// 聊天信息类型 (用于持久化)
export interface ChatInfo {
  id: string;
  title: string;
  createTime: number;
  updateTime: number;
  messageCount: number;
}

// 运行时聊天状态 (不持久化)
export interface RuntimeChatState {
  isGenerating: boolean;
  currentMessageId: string | null;
  abortController: AbortController | null;
}

// 启用的工具项
export interface EnableToolItem {
  name: string;
  description: string;
  enabled: boolean;
  inputSchema: Record<string, unknown>;
}

// 聊天设置
export interface ChatSetting {
  modelIndex: number;
  systemPrompt: string;
  enableTools: EnableToolItem[];
  temperature: number;
  enableWebSearch: boolean;
  contextLength: number;
  parallelToolCalls: boolean;
}

// 完整聊天数据类型 (用于持久化)
export interface ChatData {
  info: ChatInfo;
  messages: ChatMessage[];
  updateTime: number;
  settings: ChatSetting;
}

// 类型守卫：判断是否为助手消息
export function isAssistantMessage(msg: RuntimeMessage): msg is (AssistantMessage & { status: MessageStatus }) {
  return msg.role === 'assistant';
}
// 类型守卫：判断是否为客户端提示消息
export function isClientNoticeMessage(msg: RuntimeMessage): msg is ClientNoticeMessage {
  return msg.role === 'client-notice';
}
