// Web 端 MessageBridge 测试脚本
import { createMessageBridge } from '@engine/service/messageBridgeInstance';
import { mcpClientManager } from '@/store/mcpStore';
import { llmService } from '@engine/service/llmService';

console.log('=== MessageBridge 测试开始 ===');

try {
  // 测试 1: 创建 MessageBridge 实例
  console.log('测试 1: 创建 MessageBridge 实例');
  const messageBridge = createMessageBridge('web', {
    mcpClient: mcpClientManager,
    llmService: llmService,
  });
  console.log('✅ MessageBridge 实例创建成功');
  console.log('实例类型:', typeof messageBridge);
  console.log('是否有 send 方法:', typeof messageBridge.send === 'function');
  console.log('是否有 on 方法:', typeof messageBridge.on === 'function');
  
  // 测试 2: 事件监听器注册
  console.log('\n测试 2: 事件监听器注册');
  let eventReceived = false;
  messageBridge.on('status', (payload) => {
    console.log('收到 status 事件:', payload);
    eventReceived = true;
  });
  console.log('✅ 事件监听器注册成功');
  
  // 测试 3: 触发事件
  console.log('\n测试 3: 手动触发事件');
  messageBridge.emit('status', { status: 'test', message: '测试消息' });
  setTimeout(() => {
    if (eventReceived) {
      console.log('✅ 事件触发和接收成功');
    } else {
      console.log('❌ 事件未被接收');
    }
  }, 100);
  
  // 测试 4: llmService 适配器
  console.log('\n测试 4: llmService 适配器');
  console.log('llmService 类型:', typeof llmService);
  console.log('llmService.send 类型:', typeof llmService.send);
  console.log('llmService.abort 类型:', typeof llmService.abort);
  
  if (typeof llmService.send === 'function') {
    console.log('✅ llmService 适配器正常');
  } else {
    console.log('❌ llmService 适配器异常');
  }
  
} catch (error) {
  console.error('❌ MessageBridge 测试失败:', error);
  console.error('错误堆栈:', error.stack);
}

console.log('\n=== MessageBridge 测试结束 ===');