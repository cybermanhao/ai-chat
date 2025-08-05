import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMessageBridge } from '@engine/service/messageBridgeInstance';
import { llmService } from '@engine/service/llmService';

describe('MessageBridge Web Integration', () => {
  let messageBridge: any;
  
  beforeEach(() => {
    // 为每个测试创建新的 MessageBridge 实例
    messageBridge = createMessageBridge('web', {
      mcpClient: null, // 测试中暂时不需要 MCP
      llmService: llmService,
    });
  });

  it('should create MessageBridge instance successfully', () => {
    expect(messageBridge).toBeDefined();
    expect(typeof messageBridge.send).toBe('function');
    expect(typeof messageBridge.on).toBe('function');
    expect(typeof messageBridge.emit).toBe('function');
    expect(typeof messageBridge.off).toBe('function');
  });

  it('should register and trigger event listeners', () => {
    const mockCallback = vi.fn();
    
    // 注册事件监听器
    messageBridge.on('status', mockCallback);
    
    // 触发事件
    const testPayload = { status: 'test', message: 'hello' };
    messageBridge.emit('status', testPayload);
    
    // 验证回调被调用
    expect(mockCallback).toHaveBeenCalledWith(testPayload);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should remove event listeners correctly', () => {
    const mockCallback = vi.fn();
    
    // 注册并移除事件监听器
    messageBridge.on('status', mockCallback);
    messageBridge.off('status', mockCallback);
    
    // 触发事件
    messageBridge.emit('status', { test: true });
    
    // 验证回调未被调用
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should have llmService adapter configured', () => {
    // 验证 Web 环境下的 llmService 适配器
    expect(llmService).toBeDefined();
    expect(typeof llmService.send).toBe('function');
    expect(typeof llmService.abort).toBe('function');
  });

  it('should handle message/llm/chat protocol', () => {
    const mockCallback = vi.fn();
    
    // 模拟 llmService.send 方法
    const originalSend = llmService.send;
    llmService.send = vi.fn((type, payload, callback) => {
      expect(type).toBe('message/llm/chat');
      expect(payload).toBeDefined();
      expect(typeof callback).toBe('function');
      
      // 模拟回调
      callback({ type: 'chunk', content: 'test response' });
      callback({ type: 'done', result: 'completed' });
    });
    
    // 注册事件监听器
    messageBridge.on('chunk', mockCallback);
    messageBridge.on('done', mockCallback);
    
    // 发送消息
    messageBridge.send('message/llm/chat', {
      messages: [{ role: 'user', content: 'test' }],
      model: 'test-model'
    });
    
    // 验证 llmService.send 被调用
    expect(llmService.send).toHaveBeenCalled();
    
    // 恢复原始方法
    llmService.send = originalSend;
  });

  it('should warn for unsupported message types', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // 发送不支持的消息类型
    messageBridge.send('unsupported/message/type', {});
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('未知消息类型')
    );
    
    consoleSpy.mockRestore();
  });
});

describe('TaskLoop Integration', () => {
  it('should create TaskLoop with MessageBridge', async () => {
    const { TaskLoop } = await import('@engine/stream/task-loop');
    
    const taskLoop = new TaskLoop({
      chatId: 'test-chat',
      history: [],
      config: {
        model: 'test-model',
        temperature: 0.7
      },
      mcpClient: null
    });
    
    expect(taskLoop).toBeDefined();
    expect(typeof taskLoop.subscribe).toBe('function');
    expect(typeof taskLoop.start).toBe('function');
    expect(typeof taskLoop.abortTask).toBe('function');
  });

  it('should handle TaskLoop event subscription', async () => {
    const { TaskLoop } = await import('@engine/stream/task-loop');
    const mockEventCallback = vi.fn();
    
    const taskLoop = new TaskLoop({
      chatId: 'test-chat',
      history: [],
      config: { model: 'test-model' },
      mcpClient: null
    });
    
    // 订阅事件
    const unsubscribe = taskLoop.subscribe(mockEventCallback);
    
    expect(typeof unsubscribe).toBe('function');
    
    // 清理订阅
    unsubscribe();
  });
});