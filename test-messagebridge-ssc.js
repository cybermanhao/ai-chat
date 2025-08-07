// 测试MessageBridge的SSC模式适配
import { createMessageBridge } from './engine/service/messageBridgeInstance.js';

async function testSSCMode() {
  console.log('=== 测试MessageBridge SSC模式适配 ===');
  
  // 设置SSC API地址（模拟）
  globalThis.SSC_API_BASE_URL = 'http://localhost:8080';
  
  // 创建SSC模式的MessageBridge
  const bridge = createMessageBridge({
    env: 'ssc',
    mcpClient: null,
    llmService: null, // SSC模式下会自动创建HTTP适配器
  });
  
  // 监听事件
  bridge.on('status', (event) => {
    console.log('[Test] 收到status事件:', event);
  });
  
  bridge.on('chunk', (event) => {
    console.log('[Test] 收到chunk事件:', event.content);
  });
  
  bridge.on('done', (event) => {
    console.log('[Test] 收到done事件:', event);
  });
  
  bridge.on('error', (event) => {
    console.log('[Test] 收到error事件:', event);
  });
  
  bridge.on('toolcall', (event) => {
    console.log('[Test] 收到toolcall事件:', event);
  });
  
  bridge.on('toolresult', (event) => {
    console.log('[Test] 收到toolresult事件:', event);
  });
  
  // 测试LLM聊天
  console.log('\n--- 测试LLM聊天请求 ---');
  try {
    bridge.chatLLM({
      chatId: 'test-chat',
      messages: [
        { role: 'user', content: '你好' }
      ],
      model: 'deepseek-chat',
      temperature: 0.7,
    });
  } catch (error) {
    console.error('LLM聊天测试失败:', error.message);
  }
  
  // 等待一段时间后测试MCP工具调用
  setTimeout(() => {
    console.log('\n--- 测试MCP工具调用 ---');
    try {
      bridge.callTool('auto', 'query_url', {
        natural_language_input: '客户列表'
      });
    } catch (error) {
      console.error('MCP工具调用测试失败:', error.message);
    }
  }, 2000);
  
  // 测试中断
  setTimeout(() => {
    console.log('\n--- 测试LLM中断 ---');
    bridge.abortLLM();
  }, 5000);
}

// 运行测试
testSSCMode().catch(console.error);