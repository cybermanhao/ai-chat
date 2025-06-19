import type { Message } from './openai';

// 基础聊天消息类型
export interface ChatMessage extends Message {
  id: string;
  timestamp: number;
}

// 聊天消息状态类型
export type MessageStatus = 'connecting' | 'thinking' | 'answering' | 'stable';

// 流式聊天消息类型
export interface StreamingMessage extends ChatMessage {
  reasoning_content?: string;
  status: MessageStatus;
}

// 聊天信息类型
export interface ChatInfo {
  id: string;
  title: string;
  createTime: number;
  updateTime: number;
  messageCount: number;
}

// 完整聊天数据类型
export interface ChatData {
  info: ChatInfo;
  messages: ChatMessage[];
  updateTime?: number;
}
