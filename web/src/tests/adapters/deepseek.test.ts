// web/src/tests/adapters/deepseek.test.ts
// DeepSeek适配器自动化测试

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  ModelAdapterManager, 
  DeepSeekAdapter, 
  ModelAdapterType,
  type UnifiedLLMParams 
} from '@engine/adapters';
import type { LLMConfig } from '@engine/utils/llms';
import type { StorageMessage } from '@engine/utils/messageConverter';

describe('DeepSeek适配器测试', () => {
  let deepSeekConfig: LLMConfig;
  let testMessages: StorageMessage[];

  beforeEach(() => {
    // DeepSeek配置
    deepSeekConfig = {
      id: 'deepseek',
      provider: 'deepseek',
      baseUrl: 'https://api.deepseek.com/v1',
      isOpenAICompatible: false,
      models: ['deepseek-chat', 'deepseek-reasoner'],
      userModel: 'deepseek-chat'
    } as LLMConfig;

    // 测试消息
    testMessages = [
      {
        id: 'msg-1',
        role: 'system',
        content: '你是一个有用的AI助手',
        timestamp: Date.now(),
        chatId: 'test-chat'
      },
      {
        id: 'msg-2', 
        role: 'user',
        content: '你好，请介绍一下你自己',
        timestamp: Date.now(),
        chatId: 'test-chat'
      }
    ];
  });

  describe('DeepSeekAdapter单元测试', () => {
    it('应该正确识别DeepSeek LLM配置', () => {
      expect(DeepSeekAdapter.isDeepSeekLLM(deepSeekConfig)).toBe(true);
      
      // 测试通过baseUrl识别
      const configWithBaseUrl = {
        ...deepSeekConfig,
        id: 'custom',
        provider: 'custom'
      };
      expect(DeepSeekAdapter.isDeepSeekLLM(configWithBaseUrl)).toBe(true);
      
      // 测试OpenAI配置
      const openAIConfig = {
        id: 'openai',
        provider: 'openai', 
        baseUrl: 'https://api.openai.com/v1'
      } as LLMConfig;
      expect(DeepSeekAdapter.isDeepSeekLLM(openAIConfig)).toBe(false);
    });

    it('应该正确识别推理模型', () => {
      expect(DeepSeekAdapter.supportsReasoning('deepseek-reasoner')).toBe(true);
      expect(DeepSeekAdapter.supportsReasoning('deepseek-chat')).toBe(false);
      expect(DeepSeekAdapter.supportsReasoning('gpt-4')).toBe(false);
    });

    it('应该正确转换存储消息为DeepSeek格式', () => {
      const converted = DeepSeekAdapter.storageToDeepSeek(testMessages);
      
      expect(converted).toHaveLength(2);
      expect(converted[0].role).toBe('system');
      expect(converted[0].content).toBe('你是一个有用的AI助手');
      expect(converted[1].role).toBe('user');
      expect(converted[1].content).toBe('你好，请介绍一下你自己');
      
      // 检查没有prefix字段（默认不启用）
      expect(converted[0].prefix).toBeUndefined();
      expect(converted[1].prefix).toBeUndefined();
    });

    it('应该正确处理prefix completion', () => {
      const assistantMessage: StorageMessage = {
        id: 'msg-3',
        role: 'assistant',
        content: '你好！我是DeepSeek',
        timestamp: Date.now(),
        chatId: 'test-chat'
      };
      
      const messagesWithAssistant = [...testMessages, assistantMessage];
      const converted = DeepSeekAdapter.storageToDeepSeek(messagesWithAssistant, {
        enablePrefix: true
      });
      
      // 最后一条assistant消息应该有prefix=true
      const lastMessage = converted[converted.length - 1];
      expect(lastMessage.role).toBe('assistant');
      expect(lastMessage.prefix).toBe(true);
    });

    it('应该正确清理消息（移除reasoning_content）', () => {
      const messagesWithReasoning = [
        ...testMessages,
        {
          id: 'msg-3',
          role: 'assistant',
          content: '这是回复内容',
          reasoning_content: '这是推理内容（应该被移除）',
          timestamp: Date.now(),
          chatId: 'test-chat'
        } as any
      ];

      const cleaned = DeepSeekAdapter.cleanForDeepSeek(messagesWithReasoning);
      
      expect(cleaned).toHaveLength(3);
      const assistantMsg = cleaned.find(m => m.role === 'assistant');
      expect(assistantMsg).toBeDefined();
      expect(assistantMsg!.content).toBe('这是回复内容');
      expect((assistantMsg as any).reasoning_content).toBeUndefined();
    });

    it('应该正确验证DeepSeek API参数', () => {
      const validMessages = DeepSeekAdapter.storageToDeepSeek(testMessages);
      const validation = DeepSeekAdapter.validateParams(validMessages, 'deepseek-chat');
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toHaveLength(0);
    });

    it('应该检测到推理模型的警告', () => {
      const messages = DeepSeekAdapter.storageToDeepSeek(testMessages);
      const validation = DeepSeekAdapter.validateParams(messages, 'deepseek-reasoner');
      
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('使用推理模型，响应将包含reasoning_content字段');
    });

    it('应该检测到reasoning_content在请求中的错误', () => {
      const invalidMessages = [
        {
          role: 'user' as const,
          content: '测试消息',
          reasoning_content: '不应该在请求中包含'
        }
      ];
      
      const validation = DeepSeekAdapter.validateParams(invalidMessages, 'deepseek-chat');
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('请求消息中不应包含reasoning_content字段');
    });
  });

  describe('ModelAdapterManager集成测试', () => {
    let unifiedParams: UnifiedLLMParams;

    beforeEach(() => {
      unifiedParams = {
        llmConfig: deepSeekConfig,
        model: 'deepseek-chat',
        messages: testMessages,
        tools: [],
        temperature: 0.7,
        maxTokens: 2000,
        parallelToolCalls: true
      };
    });

    it('应该正确检测DeepSeek适配器类型', () => {
      const adapterType = ModelAdapterManager.detectAdapterType(deepSeekConfig, 'deepseek-chat');
      expect(adapterType).toBe(ModelAdapterType.DEEPSEEK);
      
      // 测试通过模型名称检测
      const genericConfig = { baseUrl: 'https://example.com/v1' } as LLMConfig;
      const typeByModel = ModelAdapterManager.detectAdapterType(genericConfig, 'deepseek-chat');
      expect(typeByModel).toBe(ModelAdapterType.DEEPSEEK);
    });

    it('应该使用DeepSeek适配器转换消息', () => {
      const converted = ModelAdapterManager.convertMessages(unifiedParams);
      
      expect(converted).toHaveLength(2);
      expect(converted[0].role).toBe('system');
      expect(converted[1].role).toBe('user');
      
      // 验证是DeepSeek格式（可能包含prefix字段）
      expect(converted[0]).toHaveProperty('role');
      expect(converted[0]).toHaveProperty('content');
    });

    it('应该使用DeepSeek适配器清理消息', () => {
      const messagesWithExtra = [
        ...testMessages,
        {
          id: 'msg-3',
          role: 'client-notice' as any,
          content: '系统通知（应该被移除）',
          timestamp: Date.now(),
          chatId: 'test-chat'
        }
      ];

      const cleaned = ModelAdapterManager.cleanMessages(messagesWithExtra, deepSeekConfig);
      
      // client-notice消息应该被移除
      expect(cleaned.length).toBeLessThan(messagesWithExtra.length);
      expect(cleaned.find(m => (m as any).role === 'client-notice')).toBeUndefined();
    });

    it('应该正确验证DeepSeek参数', () => {
      const validation = ModelAdapterManager.validateParams(unifiedParams);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('应该构建正确的API参数', () => {
      const apiParams = ModelAdapterManager.buildAPIParams(unifiedParams);
      
      expect(apiParams.model).toBe('deepseek-chat');
      expect(apiParams.messages).toHaveLength(2);
      expect(apiParams.temperature).toBe(0.7);
      expect(apiParams.max_tokens).toBe(2000);
      expect(apiParams.stream).toBe(true);
    });

    it('应该获取正确的API配置', () => {
      const apiConfig = ModelAdapterManager.getAPIConfig(unifiedParams);
      
      expect(apiConfig.baseURL).toBe('https://api.deepseek.com/v1');
      expect(apiConfig.additionalHeaders).toBeUndefined(); // 默认不使用beta端点
    });

    it('应该在启用prefix时使用beta端点', () => {
      const paramsWithPrefix = {
        ...unifiedParams,
        enablePrefix: true
      };
      
      const apiConfig = ModelAdapterManager.getAPIConfig(paramsWithPrefix);
      expect(apiConfig.baseURL).toBe('https://api.deepseek.com/beta');
    });

    it('应该获取正确的模型能力信息', () => {
      const capabilities = ModelAdapterManager.getModelCapabilities('deepseek-chat', deepSeekConfig);
      
      expect(capabilities.supportsTools).toBe(true);
      expect(capabilities.supportsStructuredOutputs).toBe(false); // DeepSeek不支持
      expect(capabilities.supportsReasoning).toBe(false); // deepseek-chat不支持推理
      expect(capabilities.supportsPrefix).toBe(true);
      expect(capabilities.maxTokens).toBe(128000);
    });

    it('应该正确识别推理模型的能力', () => {
      const capabilities = ModelAdapterManager.getModelCapabilities('deepseek-reasoner', deepSeekConfig);
      
      expect(capabilities.supportsReasoning).toBe(true);
      expect(capabilities.supportsPrefix).toBe(true);
    });
  });

  describe('错误处理测试', () => {
    it('应该处理空的LLM配置', () => {
      const emptyConfig = {} as LLMConfig;
      
      // 不应该抛出异常
      expect(() => {
        DeepSeekAdapter.isDeepSeekLLM(emptyConfig);
      }).not.toThrow();
      
      expect(DeepSeekAdapter.isDeepSeekLLM(emptyConfig)).toBe(false);
    });

    it('应该处理undefined字段', () => {
      const configWithUndefined = {
        id: 'deepseek',
        provider: undefined,
        baseUrl: undefined
      } as any;
      
      expect(() => {
        DeepSeekAdapter.isDeepSeekLLM(configWithUndefined);
      }).not.toThrow();
      
      expect(DeepSeekAdapter.isDeepSeekLLM(configWithUndefined)).toBe(true); // 通过id识别
    });

    it('应该处理空消息数组', () => {
      const emptyMessages: StorageMessage[] = [];
      
      expect(() => {
        DeepSeekAdapter.storageToDeepSeek(emptyMessages);
      }).not.toThrow();
      
      const result = DeepSeekAdapter.storageToDeepSeek(emptyMessages);
      expect(result).toHaveLength(0);
    });

    it('应该处理多个prefix消息的错误', () => {
      const invalidMessages = [
        {
          role: 'assistant' as const,
          content: '第一条assistant消息',
          prefix: true
        },
        {
          role: 'assistant' as const,  
          content: '第二条assistant消息',
          prefix: true
        }
      ];
      
      const validation = DeepSeekAdapter.validateParams(invalidMessages, 'deepseek-chat');
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('最多只能有一个消息设置prefix=true');
    });
  });
});

// 性能测试
describe('DeepSeek适配器性能测试', () => {
  it('应该能处理大量消息', () => {
    const largeMessageSet: StorageMessage[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `msg-${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `测试消息 ${i}`,
      timestamp: Date.now(),
      chatId: 'test-chat'
    }));

    const start = performance.now();
    const converted = DeepSeekAdapter.storageToDeepSeek(largeMessageSet);
    const end = performance.now();

    expect(converted).toHaveLength(1000);
    expect(end - start).toBeLessThan(100); // 应该在100ms内完成
  });
});