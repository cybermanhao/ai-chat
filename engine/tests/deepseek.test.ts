import { describe, it, expect } from 'vitest';
import type { AssistantMessage } from '../types/chat';

describe('Deepseek 字段类型与合并行为', () => {
  it('应能正确合并 Deepseek 字段', () => {
    const msg: AssistantMessage = {
      id: '1',
      role: 'assistant',
      content: 'hi',
      timestamp: Date.now(),
      status: 'generating',
      reasoning_content: '推理',
      tool_content: '工具',
      observation_content: '观察',
      thought_content: '思考'
    };
    // 合并新字段
    const updated = {
      ...msg,
      content: 'hi2',
      reasoning_content: '新推理',
      tool_content: '新工具',
      observation_content: '新观察',
      thought_content: '新思考'
    };
    expect(updated.content).toBe('hi2');
    expect(updated.reasoning_content).toBe('新推理');
    expect(updated.tool_content).toBe('新工具');
    expect(updated.observation_content).toBe('新观察');
    expect(updated.thought_content).toBe('新思考');
  });
});