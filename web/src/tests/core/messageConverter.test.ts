// web/src/tests/core/messageConverter.test.ts
// MessageConverter 核心功能测试

import { describe, it, expect, beforeEach } from 'vitest';
import { MessageConverter } from '@engine/utils/messageConverter';
import type { StorageMessage, UIMessage } from '@engine/utils/messageConverter';

describe('MessageConverter 核心功能测试', () => {
  let testStorageMessages: StorageMessage[];
  let testUIMessages: UIMessage[];

  beforeEach(() => {
    testStorageMessages = [
      {
        id: 'msg-1',
        role: 'system',
        content: '你是一个有用的AI助手',
        timestamp: 1000,
        chatId: 'test-chat'
      },
      {
        id: 'msg-2', 
        role: 'user',
        content: '你好',
        timestamp: 2000,
        chatId: 'test-chat'
      },
      {
        id: 'msg-3',
        role: 'assistant',
        content: '你好！有什么可以帮助你的吗？',
        timestamp: 3000,
        chatId: 'test-chat'
      }
    ];

    testUIMessages = [
      {
        id: 'ui-1',
        role: 'user',
        content: '测试消息',
        timestamp: 1000,
        isVisible: true
      },
      {
        id: 'ui-2',
        role: 'assistant', 
        content: '回复消息',
        timestamp: 2000,
        isVisible: true
      }
    ];
  });

  describe('存储格式转换', () => {
    it('应该正确转换存储消息为OpenAI格式', () => {
      const result = MessageConverter.storageToOpenAI(testStorageMessages);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toEqual({
        role: 'system',
        content: '你是一个有用的AI助手'
      });
      expect(result.data[1]).toEqual({
        role: 'user',
        content: '你好'
      });
      expect(result.data[2]).toEqual({
        role: 'assistant',
        content: '你好！有什么可以帮助你的吗？'
      });
    });

    it('应该过滤无效的消息角色', () => {
      const messagesWithInvalid = [
        ...testStorageMessages,
        {
          id: 'invalid-1',
          role: 'client-notice' as any,
          content: '系统通知',
          timestamp: 4000,
          chatId: 'test-chat'
        }
      ];

      const result = MessageConverter.storageToOpenAI(messagesWithInvalid);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3); // 无效消息被过滤
      expect(result.warnings).toContain('过滤了 1 条无效角色的消息');
    });

    it('应该处理工具调用消息', () => {
      const toolMessages: StorageMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: null,
          timestamp: 1000,
          chatId: 'test-chat',
          tool_calls: [{
            id: 'call-1',
            type: 'function',
            function: {
              name: 'get_weather',
              arguments: '{"city": "北京"}'
            }
          }]
        },
        {
          id: 'msg-2',
          role: 'tool',
          content: '{"temperature": 20, "weather": "晴天"}',
          timestamp: 2000,
          chatId: 'test-chat',
          tool_call_id: 'call-1'
        }
      ];

      const result = MessageConverter.storageToOpenAI(toolMessages);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      
      const assistantMsg = result.data[0] as any;
      expect(assistantMsg.role).toBe('assistant');
      expect(assistantMsg.tool_calls).toHaveLength(1);
      expect(assistantMsg.tool_calls[0].function.name).toBe('get_weather');
      
      const toolMsg = result.data[1] as any;
      expect(toolMsg.role).toBe('tool');
      expect(toolMsg.tool_call_id).toBe('call-1');
    });
  });

  describe('UI格式转换', () => {
    it('应该正确转换UI消息为存储格式', () => {
      const result = MessageConverter.uiToStorage(testUIMessages, 'test-chat');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        id: 'ui-1',
        role: 'user',
        content: '测试消息',
        timestamp: 1000,
        chatId: 'test-chat'
      });
      expect(result.data[1]).toEqual({
        id: 'ui-2',
        role: 'assistant',
        content: '回复消息',
        timestamp: 2000,
        chatId: 'test-chat'
      });
    });

    it('应该过滤UI特有的字段', () => {
      const uiMessagesWithExtra: UIMessage[] = [
        {
          id: 'ui-1',
          role: 'user',
          content: '测试',
          timestamp: 1000,
          isVisible: true,
          isHighlighted: true,
          customData: { theme: 'dark' }
        }
      ];

      const result = MessageConverter.uiToStorage(uiMessagesWithExtra, 'test-chat');

      expect(result.success).toBe(true);
      const storageMsg = result.data[0];
      expect(storageMsg).not.toHaveProperty('isVisible');
      expect(storageMsg).not.toHaveProperty('isHighlighted');
      expect(storageMsg.customData).toEqual({ theme: 'dark' }); // 扩展字段应保留
    });
  });

  describe('API响应转换', () => {
    it('应该正确转换API响应为UI格式', () => {
      const apiResponse = {
        role: 'assistant',
        content: 'API回复内容',
        tool_calls: []
      };

      const result = MessageConverter.apiResponseToUI(apiResponse, 'test-chat');

      expect(result.id).toBeDefined();
      expect(result.role).toBe('assistant');
      expect(result.content).toBe('API回复内容');
      expect(result.timestamp).toBeDefined();
      expect(result.chatId).toBe('test-chat');
    });

    it('应该处理带有扩展字段的API响应', () => {
      const apiResponse = {
        role: 'assistant',
        content: '回复',
        reasoning_content: '推理过程'
      };

      const result = MessageConverter.apiResponseToUI(
        apiResponse, 
        'test-chat', 
        { reasoning_content: apiResponse.reasoning_content }
      );

      expect(result.reasoning_content).toBe('推理过程');
    });
  });

  describe('MCP工具转换', () => {
    it('应该正确转换MCP工具为OpenAI格式', () => {
      const mcpTools = [
        {
          name: 'get_weather',
          description: '获取天气信息',
          inputSchema: {
            type: 'object',
            properties: {
              city: {
                type: 'string',
                description: '城市名称'
              }
            },
            required: ['city']
          }
        }
      ];

      const result = MessageConverter.mcpToolsToOpenAI(mcpTools);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: 'function',
        function: {
          name: 'get_weather',
          description: '获取天气信息',
          parameters: {
            type: 'object',
            properties: {
              city: {
                type: 'string',
                description: '城市名称'
              }
            },
            required: ['city']
          }
        }
      });
    });

    it('应该处理附加参数', () => {
      const mcpTools = [
        {
          name: 'test_tool',
          description: '测试工具',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ];

      const additionalParams = { strict: true };
      const result = MessageConverter.mcpToolsToOpenAI(mcpTools, additionalParams);

      expect(result[0].function).toHaveProperty('strict', true);
    });
  });

  describe('消息清理', () => {
    it('应该移除客户端通知消息', () => {
      const messagesWithNotice = [
        ...testStorageMessages,
        {
          id: 'notice-1',
          role: 'client-notice' as any,
          content: '系统通知',
          timestamp: 4000,
          chatId: 'test-chat'
        }
      ];

      const result = MessageConverter.cleanMessages(messagesWithNotice, {
        removeClientNotice: true
      });

      expect(result).toHaveLength(3);
      expect(result.find(m => (m as any).role === 'client-notice')).toBeUndefined();
    });

    it('应该移除空内容消息', () => {
      const messagesWithEmpty = [
        ...testStorageMessages,
        {
          id: 'empty-1',
          role: 'user',
          content: '',
          timestamp: 4000,
          chatId: 'test-chat'
        },
        {
          id: 'empty-2',
          role: 'assistant',
          content: null,
          timestamp: 5000,
          chatId: 'test-chat'
        }
      ];

      const result = MessageConverter.cleanMessages(messagesWithEmpty, {
        removeEmptyContent: true
      });

      expect(result).toHaveLength(3); // 原始3条消息，空内容的被移除
    });

    it('应该移除黑名单字段', () => {
      const messagesWithExtraFields = testStorageMessages.map(msg => ({
        ...msg,
        reasoning_content: '推理内容',
        internal_field: '内部字段'
      }));

      const result = MessageConverter.cleanMessages(messagesWithExtraFields, {
        fieldBlacklist: ['reasoning_content', 'internal_field']
      });

      result.forEach(msg => {
        expect(msg).not.toHaveProperty('reasoning_content');
        expect(msg).not.toHaveProperty('internal_field');
      });
    });
  });

  describe('消息验证', () => {
    it('应该正确验证有效消息', () => {
      expect(MessageConverter.isValidMessage(testStorageMessages[0])).toBe(true);
      expect(MessageConverter.isValidMessage(testStorageMessages[1])).toBe(true);
      expect(MessageConverter.isValidMessage(testStorageMessages[2])).toBe(true);
    });

    it('应该识别无效的assistant消息', () => {
      const invalidAssistant = {
        id: 'invalid',
        role: 'assistant' as const,
        content: null, // assistant消息没有content且没有tool_calls
        timestamp: 1000,
        chatId: 'test-chat'
      };

      expect(MessageConverter.isValidMessage(invalidAssistant)).toBe(false);
    });

    it('应该允许有tool_calls但无content的assistant消息', () => {
      const validAssistantWithTools = {
        id: 'valid',
        role: 'assistant' as const,
        content: null,
        timestamp: 1000,
        chatId: 'test-chat',
        tool_calls: [{
          id: 'call-1',
          type: 'function' as const,
          function: {
            name: 'test_tool',
            arguments: '{}'
          }
        }]
      };

      expect(MessageConverter.isValidMessage(validAssistantWithTools)).toBe(true);
    });

    it('应该验证tool消息必须有tool_call_id', () => {
      const invalidToolMessage = {
        id: 'invalid',
        role: 'tool' as const,
        content: '结果',
        timestamp: 1000,
        chatId: 'test-chat'
        // 缺少 tool_call_id
      };

      expect(MessageConverter.isValidMessage(invalidToolMessage)).toBe(false);
    });
  });

  describe('错误处理', () => {
    it('应该处理空消息数组', () => {
      const result = MessageConverter.storageToOpenAI([]);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('应该报告转换错误', () => {
      const invalidMessages = [
        {
          id: 'invalid',
          role: 'invalid_role' as any,
          content: '测试',
          timestamp: 1000,
          chatId: 'test'
        }
      ];

      const result = MessageConverter.storageToOpenAI(invalidMessages);
      
      expect(result.success).toBe(true); // 依然成功，但有警告
      expect(result.warnings).toContain('过滤了 1 条无效角色的消息');
    });
  });
});