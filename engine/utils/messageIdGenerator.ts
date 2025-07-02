// engine/utils/messageIdGenerator.ts
// 消息 ID 生成工具 - Engine 版本

let messageCounter = 0;
const sessionId = Math.random().toString(36).substring(2, 15);

/**
 * 生成稳定的消息 ID
 * 在同一会话中保持唯一性，但避免使用时间戳导致的性能问题
 */
export function generateMessageId(prefix: string = 'msg'): string {
  return `${prefix}-${sessionId}-${++messageCounter}`;
}

/**
 * 生成用户消息 ID
 */
export function generateUserMessageId(): string {
  return generateMessageId('user');
}

/**
 * 生成助手消息 ID
 */
export function generateAssistantMessageId(): string {
  return generateMessageId('assistant');
}

/**
 * 生成工具消息 ID
 */
export function generateToolMessageId(): string {
  return generateMessageId('tool');
}

/**
 * 重置计数器（主要用于测试）
 */
export function resetMessageCounter(): void {
  messageCounter = 0;
}
