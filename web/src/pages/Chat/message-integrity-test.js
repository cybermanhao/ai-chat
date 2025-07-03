/**
 * 消息安全性测试脚本
 * 用于测试和验证消息对象的安全性检查
 */

console.log('=== 消息安全性测试脚本 ===');

// 测试函数：检查当前消息状态
function checkMessagesIntegrity() {
  console.log('📊 检查消息完整性...');
  
  const state = window.__REDUX_STORE__?.getState();
  if (!state) {
    console.error('❌ 无法获取Redux store');
    return;
  }
  
  const chatData = state.chat.chatData;
  let totalMessages = 0;
  let invalidMessages = 0;
  
  Object.keys(chatData).forEach(chatId => {
    const messages = chatData[chatId]?.messages || [];
    console.log(`聊天 ${chatId}: ${messages.length} 条消息`);
    
    messages.forEach((msg, index) => {
      totalMessages++;
      
      if (!msg || typeof msg !== 'object') {
        console.error(`  ❌ 消息 ${index}: 无效对象`, msg);
        invalidMessages++;
        return;
      }
      
      if (!msg.role) {
        console.error(`  ❌ 消息 ${index}: 缺少role属性`, msg);
        invalidMessages++;
        return;
      }
      
      if (!msg.id) {
        console.warn(`  ⚠️  消息 ${index}: 缺少id属性`, msg);
      }
      
      if (!msg.timestamp) {
        console.warn(`  ⚠️  消息 ${index}: 缺少timestamp属性`, msg);
      }
      
      console.log(`  ✅ 消息 ${index}: ${msg.role} - "${msg.content?.substring(0, 50) || ''}..."`);
    });
  });
  
  console.log(`📈 总计: ${totalMessages} 条消息, ${invalidMessages} 条无效`);
  return { totalMessages, invalidMessages };
}

// 测试函数：添加测试消息
function addTestMessage(type = 'valid') {
  console.log(`🧪 添加${type}测试消息...`);
  
  const state = window.__REDUX_STORE__?.getState();
  const currentChatId = state?.chat?.currentChatId;
  
  if (!currentChatId) {
    console.error('❌ 没有当前活跃的聊天');
    return;
  }
  
  let testMessage;
  
  switch (type) {
    case 'valid':
      testMessage = {
        id: `test-${Date.now()}`,
        role: 'user',
        content: '这是一条测试消息',
        timestamp: Date.now()
      };
      break;
      
    case 'no-role':
      testMessage = {
        id: `test-${Date.now()}`,
        content: '这是一条没有role的测试消息',
        timestamp: Date.now()
      };
      break;
      
    case 'no-id':
      testMessage = {
        role: 'user',
        content: '这是一条没有id的测试消息',
        timestamp: Date.now()
      };
      break;
      
    case 'tool':
      testMessage = {
        id: `test-tool-${Date.now()}`,
        role: 'tool',
        content: '这是一条工具消息，用于测试在消息列表最后添加工具消息的功能',
        timestamp: Date.now()
      };
      break;
      
    case 'invalid-object':
      testMessage = null;
      break;
      
    default:
      console.error('❌ 未知的测试类型');
      return;
  }
  
  console.log('添加消息:', testMessage);
  
  try {
    window.__REDUX_STORE__.dispatch({
      type: 'chat/addMessage',
      payload: {
        chatId: currentChatId,
        message: testMessage
      }
    });
    console.log('✅ 消息添加成功');
  } catch (error) {
    console.error('❌ 消息添加失败:', error);
  }
}

// 测试函数：清理测试消息
function cleanupTestMessages() {
  console.log('🧹 清理测试消息...');
  
  const state = window.__REDUX_STORE__?.getState();
  const currentChatId = state?.chat?.currentChatId;
  
  if (!currentChatId) {
    console.error('❌ 没有当前活跃的聊天');
    return;
  }
  
  try {
    window.__REDUX_STORE__.dispatch({
      type: 'chat/clearMessages',
      payload: { chatId: currentChatId }
    });
    console.log('✅ 测试消息清理成功');
  } catch (error) {
    console.error('❌ 清理失败:', error);
  }
}

// 测试函数：批量添加消息（模拟对话）
function addTestConversation() {
  console.log('💬 添加测试对话...');
  
  const state = window.__REDUX_STORE__?.getState();
  const currentChatId = state?.chat?.currentChatId;
  
  if (!currentChatId) {
    console.error('❌ 没有当前活跃的聊天');
    return;
  }
  
  const conversation = [
    {
      id: `test-user-${Date.now()}`,
      role: 'user',
      content: '你好，请解释一下React Hooks的概念',
      timestamp: Date.now()
    },
    {
      id: `test-assistant-${Date.now()}`,
      role: 'assistant',
      content: 'React Hooks是React 16.8引入的新特性，它让你在不编写class的情况下使用state以及其他的React特性。',
      reasoning_content: '用户询问React Hooks，我需要提供清晰的解释和示例。',
      timestamp: Date.now() + 1000
    },
    {
      id: `test-tool-${Date.now()}`,
      role: 'tool',
      content: '检索到相关文档：React Hooks官方文档链接...',
      timestamp: Date.now() + 2000
    }
  ];
  
  conversation.forEach((message, index) => {
    setTimeout(() => {
      try {
        window.__REDUX_STORE__.dispatch({
          type: 'chat/addMessage',
          payload: {
            chatId: currentChatId,
            message
          }
        });
        console.log(`✅ 添加对话消息 ${index + 1}/${conversation.length}`);
      } catch (error) {
        console.error(`❌ 添加对话消息 ${index + 1} 失败:`, error);
      }
    }, index * 100);
  });
}

// 导出测试工具
window.messageIntegrityTest = {
  checkMessagesIntegrity,
  addTestMessage,
  cleanupTestMessages,
  addTestConversation
};

console.log(`
🛠️ 消息安全性测试工具已就绪!

使用方法:
- messageIntegrityTest.checkMessagesIntegrity() - 检查当前消息完整性
- messageIntegrityTest.addTestMessage('valid') - 添加有效测试消息
- messageIntegrityTest.addTestMessage('tool') - 添加工具消息到列表末尾
- messageIntegrityTest.addTestMessage('no-role') - 添加无role的无效消息
- messageIntegrityTest.addTestMessage('invalid-object') - 添加null消息
- messageIntegrityTest.addTestConversation() - 添加完整测试对话
- messageIntegrityTest.cleanupTestMessages() - 清理当前聊天的所有消息

推荐测试流程:
1. messageIntegrityTest.checkMessagesIntegrity() - 检查现状
2. messageIntegrityTest.addTestConversation() - 添加测试数据
3. messageIntegrityTest.addTestMessage('tool') - 测试末尾添加工具消息
4. messageIntegrityTest.cleanupTestMessages() - 清理测试数据
`);

// 自动运行初始检查
checkMessagesIntegrity();
