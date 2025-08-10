// web/src/tests/core/emptyToolCallsFix.test.ts
// 测试空tool_calls数组的修复

import { describe, it, expect } from 'vitest';
import { MessageConverter, DeepSeekAdapter, OpenAIAdapter } from '@engine/adapters';

describe('空tool_calls数组修复测试', () => {
  const testMessagesWithEmptyToolCalls = [
    {
      id: 'msg-1',
      role: 'user',
      content: '测试',
      timestamp: 1000,
      chatId: 'test-chat'
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: '这是第一轮回复',
      timestamp: 2000,
      chatId: 'test-chat',
      tool_calls: [] // 空的tool_calls数组
    },
    {
      id: 'msg-3', 
      role: 'user',
      content: '测试第二轮',
      timestamp: 3000,
      chatId: 'test-chat'
    }
  ];

  it('MessageConverter应该移除空的tool_calls数组', () => {
    const cleaned = MessageConverter.cleanMessages(testMessagesWithEmptyToolCalls);
    
    const assistantMsg = cleaned.find(m => m.role === 'assistant');
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg).not.toHaveProperty('tool_calls');
  });

  it('DeepSeekAdapter应该移除空的tool_calls数组', () => {
    const cleaned = DeepSeekAdapter.cleanForDeepSeek(testMessagesWithEmptyToolCalls);
    
    const assistantMsg = cleaned.find(m => m.role === 'assistant');
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg).not.toHaveProperty('tool_calls');
  });

  it('OpenAIAdapter应该移除空的tool_calls数组', () => {
    const cleaned = OpenAIAdapter.cleanForOpenAI(testMessagesWithEmptyToolCalls);
    
    const assistantMsg = cleaned.find(m => m.role === 'assistant');
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg).not.toHaveProperty('tool_calls');
  });

  it('应该保留非空的tool_calls数组', () => {
    const messagesWithValidToolCalls = [
      ...testMessagesWithEmptyToolCalls,
      {
        id: 'msg-4',
        role: 'assistant',
        content: '这是有工具调用的回复',
        timestamp: 4000,
        chatId: 'test-chat',
        tool_calls: [{
          id: 'call-1',
          type: 'function' as const,
          function: {
            name: 'test_tool',
            arguments: '{}'
          }
        }]
      }
    ];

    const cleaned = MessageConverter.cleanMessages(messagesWithValidToolCalls);
    
    const msgWithEmptyTools = cleaned.find(m => m.content === '这是第一轮回复');
    const msgWithValidTools = cleaned.find(m => m.content === '这是有工具调用的回复');
    
    expect(msgWithEmptyTools).not.toHaveProperty('tool_calls'); // 空数组被移除
    expect(msgWithValidTools).toHaveProperty('tool_calls'); // 有效数组保留
    expect((msgWithValidTools as any).tool_calls).toHaveLength(1);
  });

  it('应该处理各种边界情况', () => {
    const edgeCaseMessages = [
      {
        id: 'edge-1',
        role: 'assistant',
        content: 'undefined tool_calls',
        tool_calls: undefined,
        timestamp: 1000,
        chatId: 'test'
      },
      {
        id: 'edge-2', 
        role: 'assistant',
        content: 'null tool_calls',
        tool_calls: null,
        timestamp: 2000,
        chatId: 'test'
      },
      {
        id: 'edge-3',
        role: 'assistant', 
        content: 'empty array tool_calls',
        tool_calls: [],
        timestamp: 3000,
        chatId: 'test'
      }
    ];

    const cleaned = MessageConverter.cleanMessages(edgeCaseMessages);
    
    cleaned.forEach(msg => {
      if (msg.content === 'empty array tool_calls') {
        expect(msg).not.toHaveProperty('tool_calls');
      } else {
        // undefined和null会保留原状（因为不是空数组）
        expect(msg).toHaveProperty('tool_calls');
      }
    });
  });
});