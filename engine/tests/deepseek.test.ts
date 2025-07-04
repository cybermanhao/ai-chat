import { describe, it, expect } from 'vitest';
import type { AssistantMessage, EnrichedMessage } from '../types/chat';

describe('Deepseek 字段类型与合并行为', () => {
  it('应能正确合并 Deepseek 字段', () => {
    const msg: EnrichedMessage & { role: 'assistant' } = {
      id: '1',
      role: 'assistant',
      content: 'hi',
      timestamp: Date.now(),
      reasoning_content: '推理过程',
      prefix: true,
    };
    // 合并新字段
    const updated = {
      ...msg,
      content: 'hi2',
      reasoning_content: '新推理',
    };
    expect(updated.content).toBe('hi2');
    expect(updated.reasoning_content).toBe('新推理');
    expect(updated.prefix).toBe(true);
  });
});