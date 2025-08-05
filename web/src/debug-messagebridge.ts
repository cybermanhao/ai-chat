// 在浏览器控制台运行的 MessageBridge 测试
// 打开 http://localhost:3000，然后在浏览器控制台粘贴这段代码

export async function testMessageBridge() {
  console.log('=== MessageBridge 浏览器测试开始 ===');
  
  try {
    // 动态导入模块
    const { createMessageBridge } = await import('@engine/service/messageBridgeInstance');
    const { llmService } = await import('@engine/service/llmService');
    
    console.log('✅ 模块导入成功');
    
    // 测试 1: 创建实例
    console.log('\n🧪 测试 1: 创建 MessageBridge 实例');
    const messageBridge = createMessageBridge('web', {
      mcpClient: null,
      llmService: llmService,
    });
    console.log('✅ MessageBridge 实例创建成功');
    console.log('实例方法:', Object.getOwnPropertyNames(Object.getPrototypeOf(messageBridge)));
    
    // 测试 2: 事件系统
    console.log('\n🧪 测试 2: 事件监听和触发');
    let eventReceived = false;
    
    messageBridge.on('status', (payload: any) => {
      console.log('📨 收到 status 事件:', payload);
      eventReceived = true;
    });
    
    messageBridge.emit('status', { status: 'test', timestamp: Date.now() });
    
    setTimeout(() => {
      if (eventReceived) {
        console.log('✅ 事件系统正常工作');
      } else {
        console.log('❌ 事件系统异常');
      }
    }, 100);
    
    // 测试 3: llmService 适配器
    console.log('\n🧪 测试 3: llmService 适配器');
    console.log('llmService 类型:', typeof llmService);
    console.log('llmService.send:', typeof llmService.send);
    console.log('llmService.abort:', typeof llmService.abort);
    
    if (typeof llmService.send === 'function') {
      console.log('✅ llmService 适配器正常');
    }
    
    // 测试 4: TaskLoop 集成
    console.log('\n🧪 测试 4: TaskLoop 集成');
    const { TaskLoop } = await import('@engine/stream/task-loop');
    
    const taskLoop = new TaskLoop({
      chatId: 'browser-test',
      history: [],
      config: {
        model: 'test-model',
        temperature: 0.7
      },
      mcpClient: null
    });
    
    console.log('✅ TaskLoop 实例创建成功');
    
    let eventCount = 0;
    const unsubscribe = taskLoop.subscribe((event: any) => {
      eventCount++;
      console.log(`📦 TaskLoop 事件 ${eventCount}:`, event.type);
    });
    
    console.log('✅ TaskLoop 事件订阅成功');
    
    // 清理
    setTimeout(() => {
      unsubscribe();
      console.log('🧹 清理完成');
      console.log('\n🎉 所有测试完成！');
    }, 1000);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('错误详情:', error);
  }
}

// 如果在浏览器中运行，自动开始测试
if (typeof window !== 'undefined') {
  console.log('检测到浏览器环境，可以手动调用 testMessageBridge() 进行测试');
  // 将函数挂载到 window 对象上，方便在控制台调用
  (window as any).testMessageBridge = testMessageBridge;
}