import { describe, it, expect } from 'vitest';
import type { RuntimeMessage, AssistantMessage, ChatMessage } from '@/types/chat';

describe('类型定义测试', () => {
  it('RuntimeMessage 应包含 Deepseek 字段', () => {
    const msg: RuntimeMessage = {
      id: '1',
      role: 'assistant',
      content: 'hi',
      timestamp: Date.now(),
      status: 'stable',
      reasoning_content: '推理',
      tool_content: '工具',
      observation_content: '观察',
      thought_content: '思考'
    };
    expect(msg.reasoning_content).toBe('推理');
  });

  it('AssistantMessage 应兼容 Deepseek 字段', () => {
    const msg: AssistantMessage = {
      id: '2',
      role: 'assistant',
      content: 'hello',
      timestamp: Date.now(),
      reasoning_content: '推理'
    };
    expect(msg.reasoning_content).toBe('推理');
  });

  it('ChatMessage 联合类型应支持所有角色', () => {
    const sys: ChatMessage = { id: '1', role: 'system', content: '', timestamp: 1 };
    const user: ChatMessage = { id: '2', role: 'user', content: '', timestamp: 1 };
    const assistant: ChatMessage = { id: '3', role: 'assistant', content: '', timestamp: 1 };
    const tool: ChatMessage = { id: '4', role: 'tool', content: '', timestamp: 1, tool_call_id: 't1' };
    expect(sys.role).toBe('system');
    expect(user.role).toBe('user');
    expect(assistant.role).toBe('assistant');
    expect(tool.role).toBe('tool');
  });
});
