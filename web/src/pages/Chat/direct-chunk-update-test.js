// 测试直接chunk更新的脚本
// 文件位置: c:\code\zz-ai-chat\web\src\pages\Chat\direct-chunk-update-test.js

// 这个脚本用于测试注释掉差分更新逻辑后，TaskLoop的每个chunk是否能正确直接更新Redux状态

console.log('=== 直接Chunk更新测试脚本 ===');

// 测试步骤：
// 1. 在浏览器控制台中执行此脚本
// 2. 发送一条消息给AI
// 3. 观察消息是否能够正常流式更新
// 4. 检查Redux DevTools中的action序列

// 获取当前Redux store状态
function getCurrentChatState() {
  const state = window.__REDUX_STORE__?.getState();
  if (!state) {
    console.error('Redux store not found. Make sure you are on the chat page.');
    return null;
  }
  
  const chatState = state.chat;
  console.log('当前聊天状态:', {
    activeChatId: chatState.activeChatId,
    isGenerating: chatState.isGenerating,
    messageCardStatus: chatState.messageCardStatus,
    messagesCount: Object.keys(chatState.chatData).reduce((acc, chatId) => {
      acc[chatId] = chatState.chatData[chatId]?.messages?.length || 0;
      return acc;
    }, {})
  });
  
  return chatState;
}

// 监听Redux store变化
function startMonitoring() {
  if (!window.__REDUX_STORE__) {
    console.error('Redux store not found');
    return;
  }
  
  console.log('开始监控Redux状态变化...');
  
  let lastMessageCount = 0;
  let updateCount = 0;
  
  const unsubscribe = window.__REDUX_STORE__.subscribe(() => {
    const state = window.__REDUX_STORE__.getState();
    const activeChatId = state.chat.activeChatId;
    
    if (activeChatId) {
      const messages = state.chat.chatData[activeChatId]?.messages || [];
      const currentMessageCount = messages.length;
      
      if (currentMessageCount !== lastMessageCount) {
        console.log(`消息数量变化: ${lastMessageCount} -> ${currentMessageCount}`);
        lastMessageCount = currentMessageCount;
        
        // 打印最后一条assistant消息的内容长度（如果存在）
        const lastAssistantMessage = messages.slice().reverse().find(msg => msg.role === 'assistant');
        if (lastAssistantMessage) {
          console.log(`最后一条assistant消息内容长度: ${lastAssistantMessage.content?.length || 0}`);
          console.log(`消息ID: ${lastAssistantMessage.id}`);
        }
      }
      
      // 检查是否正在生成
      const isGenerating = state.chat.isGenerating[activeChatId];
      if (isGenerating !== undefined) {
        console.log(`生成状态: ${isGenerating ? '正在生成' : '已停止'}`);
      }
      
      updateCount++;
      if (updateCount > 50) { // 防止过多输出
        console.log('停止监控（已达到最大更新次数）');
        unsubscribe();
      }
    }
  });
  
  // 5秒后自动停止监控
  setTimeout(() => {
    console.log('5秒后自动停止监控');
    unsubscribe();
  }, 5000);
  
  return unsubscribe;
}

// 测试消息发送
function testDirectChunkUpdate() {
  console.log('--- 开始测试直接Chunk更新 ---');
  
  // 1. 检查当前状态
  const currentState = getCurrentChatState();
  if (!currentState) return;
  
  // 2. 开始监听状态变化
  console.log('开始监听Redux状态变化...');
  const stopMonitoring = startMonitoring();
  
  // 3. 提示用户发送消息
  console.log(`
  📝 测试步骤:
  1. 在聊天界面发送一条消息（例如: "请解释一下JavaScript的闭包概念"）
  2. 观察控制台输出，检查消息是否正常流式更新
  3. 打开Redux DevTools，查看action序列
  4. 检查是否不再有差分更新相关的性能监控日志
  
  ✅ 期望结果:
  - 消息能够正常流式显示
  - 控制台显示消息内容长度逐步增加
  - Redux DevTools中看到 patchLastAssistantMessage action
  - 没有差分更新相关的调试信息
  - 性能表现良好，无明显卡顿
  `);
  
  return stopMonitoring;
}

// 检查是否有差分更新相关的代码仍在运行
function checkForDiffLogicRemoval() {
  console.log('--- 检查差分更新逻辑是否已完全移除 ---');
  
  // 检查全局对象中是否还有相关引用
  const hasStreamingPatch = window.createStreamingPatch !== undefined;
  const hasPerformanceMonitor = window.StreamingPerformanceMonitor !== undefined;
  
  console.log(`createStreamingPatch 存在: ${hasStreamingPatch}`);
  console.log(`StreamingPerformanceMonitor 存在: ${hasPerformanceMonitor}`);
  
  if (!hasStreamingPatch && !hasPerformanceMonitor) {
    console.log('✅ 差分更新相关代码已成功移除');
  } else {
    console.log('⚠️  仍有差分更新相关代码存在');
  }
}

// 性能测试
function performanceTest() {
  console.log('--- 性能测试 ---');
  console.log('发送一条较长的请求，观察更新性能...');
  
  const startTime = performance.now();
  let updateTimes = [];
  
  if (!window.__REDUX_STORE__) {
    console.error('Redux store not found');
    return;
  }
  
  const unsubscribe = window.__REDUX_STORE__.subscribe(() => {
    const currentTime = performance.now();
    updateTimes.push(currentTime - startTime);
    
    if (updateTimes.length > 20) { // 收集20次更新的时间
      const avgUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
      console.log(`平均更新时间: ${avgUpdateTime.toFixed(2)}ms`);
      console.log(`更新次数: ${updateTimes.length}`);
      unsubscribe();
    }
  });
  
  setTimeout(() => {
    unsubscribe();
  }, 10000);
}

// 导出测试函数
window.directChunkUpdateTest = {
  getCurrentChatState,
  startMonitoring,
  testDirectChunkUpdate,
  checkForDiffLogicRemoval,
  performanceTest
};

// 自动运行检查
checkForDiffLogicRemoval();

console.log(`
🚀 直接Chunk更新测试工具已就绪!

使用方法:
- directChunkUpdateTest.testDirectChunkUpdate() - 开始完整测试
- directChunkUpdateTest.getCurrentChatState() - 查看当前聊天状态
- directChunkUpdateTest.startMonitoring() - 开始监控状态变化
- directChunkUpdateTest.checkForDiffLogicRemoval() - 检查差分逻辑移除情况
- directChunkUpdateTest.performanceTest() - 性能测试

或者直接运行: directChunkUpdateTest.testDirectChunkUpdate()
`);
