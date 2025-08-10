// web/src/tests/core/modelAdapterManager.test.ts
// ModelAdapterManager 集成测试

import { describe, it, expect, beforeEach } from 'vitest';
import { ModelAdapterManager, ModelAdapterType, type UnifiedLLMParams } from '@engine/adapters';
import type { LLMConfig } from '@engine/utils/llms';
import type { StorageMessage } from '@engine/utils/messageConverter';

describe('ModelAdapterManager 集成测试', () => {
  let openAIConfig: LLMConfig;
  let deepSeekConfig: LLMConfig;
  let testMessages: StorageMessage[];

  beforeEach(() => {
    openAIConfig = {
      id: 'openai',
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      isOpenAICompatible: true,
      models: ['gpt-4', 'gpt-3.5-turbo'],
      userModel: 'gpt-4'
    } as LLMConfig;

    deepSeekConfig = {
      id: 'deepseek',
      provider: 'deepseek',
      baseUrl: 'https://api.deepseek.com/v1',
      isOpenAICompatible: false,
      models: ['deepseek-chat', 'deepseek-reasoner'],
      userModel: 'deepseek-chat'
    } as LLMConfig;

    testMessages = [
      {
        id: 'msg-1',
        role: 'user',
        content: '你好，请介绍一下你自己',
        timestamp: Date.now(),
        chatId: 'test-chat'
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: '你好！我是AI助手',
        timestamp: Date.now(),
        chatId: 'test-chat'
      }
    ];
  });

  describe('适配器类型检测', () => {
    it('应该正确检测OpenAI适配器', () => {
      const type = ModelAdapterManager.detectAdapterType(openAIConfig, 'gpt-4');
      expect(type).toBe(ModelAdapterType.OPENAI);
    });

    it('应该正确检测DeepSeek适配器', () => {
      const type = ModelAdapterManager.detectAdapterType(deepSeekConfig, 'deepseek-chat');
      expect(type).toBe(ModelAdapterType.DEEPSEEK);
    });

    it('应该通过模型名称检测DeepSeek', () => {
      const genericConfig = { baseUrl: 'https://example.com' } as LLMConfig;
      const type = ModelAdapterManager.detectAdapterType(genericConfig, 'deepseek-chat');
      expect(type).toBe(ModelAdapterType.DEEPSEEK);
    });

    it('应该默认使用OpenAI兼容适配器', () => {
      const unknownConfig = { baseUrl: 'https://unknown.com' } as LLMConfig;
      const type = ModelAdapterManager.detectAdapterType(unknownConfig, 'unknown-model');
      expect(type).toBe(ModelAdapterType.OPENAI_COMPATIBLE);
    });
  });

  describe('统一消息转换', () => {
    it('应该根据配置选择正确的适配器进行消息转换', () => {
      const openAIParams: UnifiedLLMParams = {
        llmConfig: openAIConfig,
        model: 'gpt-4',
        messages: testMessages,
        tools: [],
        temperature: 0.7,
        maxTokens: 2000,
        parallelToolCalls: true
      };

      const deepSeekParams: UnifiedLLMParams = {
        llmConfig: deepSeekConfig,
        model: 'deepseek-chat',
        messages: testMessages,
        tools: [],
        temperature: 0.7,
        maxTokens: 2000,
        parallelToolCalls: true
      };

      const openAIMessages = ModelAdapterManager.convertMessages(openAIParams);
      const deepSeekMessages = ModelAdapterManager.convertMessages(deepSeekParams);

      expect(openAIMessages).toHaveLength(2);
      expect(deepSeekMessages).toHaveLength(2);
      
      // 基本格式应该相同
      expect(openAIMessages[0].role).toBe('user');
      expect(deepSeekMessages[0].role).toBe('user');
    });
  });

  describe('工具转换', () => {
    it('应该根据适配器类型转换工具', () => {
      const mockTools = [
        {
          name: 'get_weather',
          description: '获取天气信息',
          inputSchema: {
            type: 'object',
            properties: {
              city: { type: 'string', description: '城市名称' }
            },
            required: ['city']
          }
        }
      ];

      const openAIParams: UnifiedLLMParams = {
        llmConfig: openAIConfig,
        model: 'gpt-4',
        messages: testMessages,
        tools: mockTools,
        temperature: 0.7,
        maxTokens: 2000,
        parallelToolCalls: true,
        enableStrict: true // OpenAI特有
      };

      const deepSeekParams: UnifiedLLMParams = {
        llmConfig: deepSeekConfig,
        model: 'deepseek-chat',
        messages: testMessages,
        tools: mockTools,
        temperature: 0.7,
        maxTokens: 2000,
        parallelToolCalls: true
      };

      const openAITools = ModelAdapterManager.convertTools(openAIParams);
      const deepSeekTools = ModelAdapterManager.convertTools(deepSeekParams);

      expect(openAITools).toHaveLength(1);
      expect(deepSeekTools).toHaveLength(1);
      
      expect(openAITools[0].type).toBe('function');
      expect(deepSeekTools[0].type).toBe('function');
      expect(openAITools[0].function.name).toBe('get_weather');
      expect(deepSeekTools[0].function.name).toBe('get_weather');
    });

    it('应该处理空工具列表', () => {
      const params: UnifiedLLMParams = {
        llmConfig: openAIConfig,
        model: 'gpt-4',
        messages: testMessages,
        tools: [],
        temperature: 0.7,
        maxTokens: 2000,
        parallelToolCalls: true
      };

      const tools = ModelAdapterManager.convertTools(params);
      expect(tools).toHaveLength(0);
    });
  });

  describe('消息清理', () => {
    it('应该根据适配器类型清理消息', () => {
      const messagesWithExtra = [
        ...testMessages,
        {
          id: 'msg-3',
          role: 'client-notice' as any,
          content: '系统通知',
          timestamp: Date.now(),
          chatId: 'test-chat'
        }
      ];

      const openAICleaned = ModelAdapterManager.cleanMessages(messagesWithExtra, openAIConfig);
      const deepSeekCleaned = ModelAdapterManager.cleanMessages(messagesWithExtra, deepSeekConfig);

      // client-notice 消息应该被移除
      expect(openAICleaned).toHaveLength(2);
      expect(deepSeekCleaned).toHaveLength(2);
      
      expect(openAICleaned.find(m => (m as any).role === 'client-notice')).toBeUndefined();
      expect(deepSeekCleaned.find(m => (m as any).role === 'client-notice')).toBeUndefined();
    });

    it('应该移除DeepSeek请求中的reasoning_content', () => {
      const messagesWithReasoning = [
        ...testMessages,
        {
          id: 'msg-3',
          role: 'assistant',
          content: '回复内容',
          reasoning_content: '推理内容（应该被移除）',
          timestamp: Date.now(),
          chatId: 'test-chat'
        } as any
      ];

      const deepSeekCleaned = ModelAdapterManager.cleanMessages(messagesWithReasoning, deepSeekConfig);
      
      const assistantMsg = deepSeekCleaned.find(m => m.role === 'assistant' && m.content === '回复内容');
      expect(assistantMsg).toBeDefined();
      expect((assistantMsg as any).reasoning_content).toBeUndefined();
    });
  });

  describe('参数验证', () => {
    it('应该验证有效的参数', () => {
      const validParams: UnifiedLLMParams = {
        llmConfig: openAIConfig,
        model: 'gpt-4',
        messages: testMessages,
        tools: [],
        temperature: 0.7,
        maxTokens: 2000,
        parallelToolCalls: true
      };

      const validation = ModelAdapterManager.validateParams(validParams);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('应该检测到推理模型的警告', () => {
      const reasoningParams: UnifiedLLMParams = {
        llmConfig: deepSeekConfig,
        model: 'deepseek-reasoner',
        messages: testMessages,
        tools: [],
        temperature: 0.7,
        maxTokens: 2000,
        parallelToolCalls: true
      };

      const validation = ModelAdapterManager.validateParams(reasoningParams);
      
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('使用推理模型，响应将包含reasoning_content字段');
    });
  });

  describe('API参数构建', () => {
    it('应该构建正确的API参数', () => {
      const params: UnifiedLLMParams = {
        llmConfig: openAIConfig,
        model: 'gpt-4',
        messages: testMessages,
        tools: [],
        temperature: 0.8,
        maxTokens: 1500,
        parallelToolCalls: false
      };

      const apiParams = ModelAdapterManager.buildAPIParams(params);

      expect(apiParams.model).toBe('gpt-4');
      expect(apiParams.temperature).toBe(0.8);
      expect(apiParams.max_tokens).toBe(1500);
      expect(apiParams.stream).toBe(true);
      expect(apiParams.messages).toHaveLength(2);
    });

    it('应该在有工具时添加工具参数', () => {
      const mockTools = [
        {
          name: 'test_tool',
          description: '测试工具',
          inputSchema: { type: 'object', properties: {} }
        }
      ];

      const params: UnifiedLLMParams = {
        llmConfig: openAIConfig,
        model: 'gpt-4',
        messages: testMessages,
        tools: mockTools,
        temperature: 0.7,
        maxTokens: 2000,
        parallelToolCalls: false
      };

      const apiParams = ModelAdapterManager.buildAPIParams(params);

      expect(apiParams.tools).toBeDefined();
      expect(apiParams.tools).toHaveLength(1);
      expect((apiParams as any).parallel_tool_calls).toBe(false);
    });
  });

  describe('API配置获取', () => {
    it('应该获取OpenAI的API配置', () => {
      const params: UnifiedLLMParams = {
        llmConfig: openAIConfig,
        model: 'gpt-4',
        messages: testMessages,
        tools: [],
        temperature: 0.7,
        maxTokens: 2000,
        parallelToolCalls: true
      };

      const config = ModelAdapterManager.getAPIConfig(params);
      
      expect(config.baseURL).toBe('https://api.openai.com/v1');
      expect(config.additionalHeaders).toBeUndefined();
    });

    it('应该获取DeepSeek的API配置', () => {
      const params: UnifiedLLMParams = {
        llmConfig: deepSeekConfig,
        model: 'deepseek-chat',
        messages: testMessages,
        tools: [],
        temperature: 0.7,
        maxTokens: 2000,
        parallelToolCalls: true
      };

      const config = ModelAdapterManager.getAPIConfig(params);
      
      expect(config.baseURL).toBe('https://api.deepseek.com/v1');
    });

    it('应该为DeepSeek prefix模式使用beta端点', () => {
      const params: UnifiedLLMParams = {
        llmConfig: deepSeekConfig,
        model: 'deepseek-chat',
        messages: testMessages,
        tools: [],
        temperature: 0.7,
        maxTokens: 2000,
        parallelToolCalls: true,
        enablePrefix: true
      };

      const config = ModelAdapterManager.getAPIConfig(params);
      
      expect(config.baseURL).toBe('https://api.deepseek.com/beta');
    });
  });

  describe('模型能力检测', () => {
    it('应该正确获取OpenAI模型能力', () => {
      const capabilities = ModelAdapterManager.getModelCapabilities('gpt-4', openAIConfig);
      
      expect(capabilities.supportsTools).toBe(true);
      expect(capabilities.supportsStructuredOutputs).toBe(true);
      expect(capabilities.supportsStreaming).toBe(true);
      expect(capabilities.maxTokens).toBeGreaterThan(4000);
    });

    it('应该正确获取DeepSeek模型能力', () => {
      const capabilities = ModelAdapterManager.getModelCapabilities('deepseek-chat', deepSeekConfig);
      
      expect(capabilities.supportsTools).toBe(true);
      expect(capabilities.supportsStructuredOutputs).toBe(false); // DeepSeek不支持
      expect(capabilities.supportsReasoning).toBe(false); // deepseek-chat不支持推理
      expect(capabilities.supportsPrefix).toBe(true);
      expect(capabilities.maxTokens).toBe(128000);
    });

    it('应该识别DeepSeek推理模型的能力', () => {
      const capabilities = ModelAdapterManager.getModelCapabilities('deepseek-reasoner', deepSeekConfig);
      
      expect(capabilities.supportsReasoning).toBe(true);
      expect(capabilities.supportsPrefix).toBe(true);
    });
  });

  describe('边界情况处理', () => {
    it('应该处理空的LLM配置', () => {
      const emptyConfig = {} as LLMConfig;
      
      expect(() => {
        ModelAdapterManager.detectAdapterType(emptyConfig);
      }).not.toThrow();
      
      const type = ModelAdapterManager.detectAdapterType(emptyConfig);
      expect(type).toBe(ModelAdapterType.OPENAI_COMPATIBLE);
    });

    it('应该处理空的消息数组', () => {
      const params: UnifiedLLMParams = {
        llmConfig: openAIConfig,
        model: 'gpt-4',
        messages: [],
        tools: [],
        temperature: 0.7,
        maxTokens: 2000,
        parallelToolCalls: true
      };

      const messages = ModelAdapterManager.convertMessages(params);
      expect(messages).toHaveLength(0);
    });

    it('应该处理undefined字段', () => {
      const configWithUndefined = {
        id: 'test',
        provider: undefined,
        baseUrl: undefined
      } as any;

      expect(() => {
        ModelAdapterManager.detectAdapterType(configWithUndefined, 'test-model');
      }).not.toThrow();
    });
  });

  describe('性能测试', () => {
    it('应该高效处理大量消息', () => {
      const largeMessages: StorageMessage[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `消息内容 ${i}`,
        timestamp: Date.now(),
        chatId: 'test-chat'
      }));

      const params: UnifiedLLMParams = {
        llmConfig: openAIConfig,
        model: 'gpt-4',
        messages: largeMessages,
        tools: [],
        temperature: 0.7,
        maxTokens: 2000,
        parallelToolCalls: true
      };

      const start = performance.now();
      const converted = ModelAdapterManager.convertMessages(params);
      const end = performance.now();

      expect(converted).toHaveLength(1000);
      expect(end - start).toBeLessThan(50); // 应该在50ms内完成
    });

    it('应该高效进行适配器类型检测', () => {
      const start = performance.now();
      
      // 检测1000次
      for (let i = 0; i < 1000; i++) {
        ModelAdapterManager.detectAdapterType(openAIConfig, 'gpt-4');
        ModelAdapterManager.detectAdapterType(deepSeekConfig, 'deepseek-chat');
      }
      
      const end = performance.now();
      expect(end - start).toBeLessThan(20); // 应该在20ms内完成
    });
  });
});