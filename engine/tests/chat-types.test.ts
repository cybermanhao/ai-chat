import type { MessageRole, ChatMessage, EnrichedMessage } from '../types/chat';
import { describe, it, expect } from 'vitest';

describe('ChatMessage 类型', () => {
  it('user 消息应有 role=user', () => {
    const msg: EnrichedMessage = {
      id: '1',
      timestamp: Date.now(),
      content: 'hi',
      role: 'user',
    };
    expect(msg.role).toBe('user');
  });

  it('role 只能为 MessageRole', () => {
    const roles: MessageRole[] = ['system', 'user', 'assistant', 'tool', 'client-notice'];
    expect(roles).toContain('user');
  });
});
