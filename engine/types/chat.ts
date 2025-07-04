// 引入 openai tool call 类型（如需多端适配可用自定义类型或类型导出）
import type { ChatCompletionMessageToolCall } from 'openai/resources/chat/completions';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';
// 基础消息类型
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool' | 'client-notice';
// export type MessageStatus = 'connecting' | 'thinking' | 'generating' | 'tool_calling' | 'stable' | 'done' | 'error';
// 将 MessageStatus 拆解为MessageState与IMessageCardStatus使得状态类型正交
// 各种Message本身没有状态，状态是由taskloop状态与渲染层messagecard状态维护的，但message有state记录一些停止原因等信息

export enum MessageState {
  Abort = 'abort',
  Timeout = 'timeout',
  LLMError = 'llm_error',
  MCPError = 'mcp_error',
  Success = 'success',
  unknownError = 'unknown_error',
}
// IMessageCardStatus 是渲染层渲染一组包含AssistantMessage与ToolMessage的MessageCard的状态
export type IMessageCardStatus = 'connecting' | 'thinking' | 'generating' | 'tool_calling' | 'stable' 
// 基础消息共同属性
export type BaseMessage = {

  content: string;

};

// ========== 类型系统优化 ========== //
// 1. 所有消息都必须有 id、timestamp，id 唯一即可，无需 chatId
export interface MessageMetadata {
  id: string; // 全局唯一，格式可为 `${chatId}-${msgId}` 或 uuid
  timestamp: number;
  state?: MessageState;
  name?: string;
  usage?: ChatCompletionChunk['usage'];
}
// 2. EnrichedMessage = ChatMessage & MessageMetadata
export type EnrichedMessage = ChatMessage & MessageMetadata;

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
  prefix?: boolean; //deepseek特殊优化，开启后reasoning_contengt启用
  reasoning_content?: string;//deepseek特殊优化，开启后reasoning_contengt启用
  tool_calls?: ChatCompletionMessageToolCall[]; // 工具调用数组
};

// 工具消息
export type ToolMessage = BaseMessage & {
  role: 'tool';
  tool_call_id: string;
  toolName?: string; // 添加工具名称字段
  toolArguments?: string; // 添加工具调用参数字段
};

// 客户端提示消息（用于错误提示，不会发送给模型）
export type ClientNoticeMessage = BaseMessage & {
  role: 'client-notice';
  noticeType: 'error' | 'warning' | 'info';
  errorCode?: string;

};

// 聊天消息联合类型
export type ChatMessage = SystemMessage | UserMessage | AssistantMessage | ToolMessage | ClientNoticeMessage;
// 3. 保证 userMessage 只用 id 字段


// 类型声明
export interface ToolCallContent { name: string; arguments?: string; }

// 流式响应块（如需扩展可在具体业务文件定义）
// export interface StreamChunk {
//   content: string;
//   reasoning_content?: string;
//   tool_content?: string | ToolCallContent;
//   observation_content?: string;
//   thought_content?: string;
//   error?: string;
//   tool_calls?: Array<{ function?: { name?: string; arguments?: string } }>;
// }
// 使用在用到时import type ChatCompletionChunk = OpenAI.Chat.Completions.ChatCompletionChunk;替代

// 运行时消息类型与状态管理已移交至 task-loop（原 streamManager），消息本身不再直接携带流程状态，仅保留部分终止/异常等原子状态（见 MessageState）
// 若需渲染层聚合状态，使用 IMessageCardStatus 或自定义聚合类型

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
  userModel?: string; // 用户选择的具体模型
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
  messages: EnrichedMessage[]; // 由 ChatMessage[] 改为 EnrichedMessage[]
  updateTime: number;
  settings: ChatSetting;
}

// 类型守卫相关代码已废弃，因 RuntimeMessage/MessageStatus 已移除，若需类型守卫请基于 ChatMessage 或 EnrichedMessage 自行实现
// export function isAssistantMessage(msg: RuntimeMessage): msg is (AssistantMessage & { status: MessageStatus }) {
//   return msg.role === 'assistant';
// }
// export function isClientNoticeMessage(msg: RuntimeMessage): msg is ClientNoticeMessage {
//   return msg.role === 'client-notice';
// }
