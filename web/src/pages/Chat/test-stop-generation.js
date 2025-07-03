// 停止生成功能测试脚本
// 在浏览器控制台中运行此脚本来测试停止生成功能

console.log('🧪 停止生成功能测试脚本');

// 测试函数：发送消息然后立即停止
function testStopGeneration() {
  console.log('📤 开始测试停止生成功能...');
  
  // 1. 检查当前是否有活跃的聊天
  const state = window.__REDUX_STORE__?.getState();
  if (!state) {
    console.error('❌ 无法获取 Redux store，请确保应用已正确加载');
    return;
  }
  
  const currentChatId = state.chat.currentChatId;
  if (!currentChatId) {
    console.error('❌ 没有当前活跃的聊天，请先选择或创建一个聊天');
    return;
  }
  
  console.log('✅ 当前聊天 ID:', currentChatId);
  
  // 2. 发送一个测试消息
  const testMessage = '请写一个长篇的技术文章，包含详细的代码示例和解释。';
  console.log('📝 发送测试消息:', testMessage);
  
  window.__REDUX_STORE__.dispatch({
    type: 'chat/sendMessage',
    payload: { chatId: currentChatId, input: testMessage }
  });
  
  // 3. 等待一小段时间，然后停止生成
  setTimeout(() => {
    console.log('🛑 执行停止生成...');
    
    // 检查当前是否在生成中
    const currentState = window.__REDUX_STORE__.getState();
    const isGenerating = currentState.chat.isGenerating[currentChatId];
    
    if (isGenerating) {
      console.log('✅ 确认正在生成中，执行停止...');
      window.__REDUX_STORE__.dispatch({
        type: 'chat/stopGeneration',
        payload: { chatId: currentChatId }
      });
      
      // 检查停止是否成功
      setTimeout(() => {
        const finalState = window.__REDUX_STORE__.getState();
        const finalGenerating = finalState.chat.isGenerating[currentChatId];
        const finalStatus = finalState.chat.messageCardStatus[currentChatId];
        
        console.log('📊 停止后状态:');
        console.log('  - isGenerating:', finalGenerating);
        console.log('  - messageCardStatus:', finalStatus);
        
        if (!finalGenerating && finalStatus === 'stable') {
          console.log('✅ 停止生成测试成功！');
        } else {
          console.log('❌ 停止生成可能失败，状态未正确更新');
        }
      }, 500);
      
    } else {
      console.log('⚠️ 当前没有在生成中，可能消息已经完成或出现错误');
    }
  }, 2000); // 2秒后停止，给生成一点时间开始
}

// 测试函数：快速停止（立即停止）
function testImmediateStop() {
  console.log('⚡ 开始测试立即停止功能...');
  
  const state = window.__REDUX_STORE__?.getState();
  const currentChatId = state?.chat?.currentChatId;
  
  if (!currentChatId) {
    console.error('❌ 没有当前活跃的聊天');
    return;
  }
  
  // 发送消息
  const testMessage = '请解释量子计算的原理和应用，要求详细且完整。';
  console.log('📝 发送测试消息:', testMessage);
  
  window.__REDUX_STORE__.dispatch({
    type: 'chat/sendMessage',
    payload: { chatId: currentChatId, input: testMessage }
  });
  
  // 立即停止（100ms后）
  setTimeout(() => {
    console.log('⚡ 立即停止生成...');
    window.__REDUX_STORE__.dispatch({
      type: 'chat/stopGeneration',
      payload: { chatId: currentChatId }
    });
  }, 100);
}

// 监控函数：观察状态变化
function monitorGenerationState() {
  console.log('👀 开始监控生成状态变化...');
  
  let previousState = null;
  const unsubscribe = window.__REDUX_STORE__.subscribe(() => {
    const state = window.__REDUX_STORE__.getState();
    const currentChatId = state.chat.currentChatId;
    
    if (currentChatId) {
      const currentGenerating = state.chat.isGenerating[currentChatId];
      const currentStatus = state.chat.messageCardStatus[currentChatId];
      
      const currentStateStr = `${currentGenerating}-${currentStatus}`;
      
      if (currentStateStr !== previousState) {
        console.log(`📊 状态变化: isGenerating=${currentGenerating}, status=${currentStatus}`, {
          timestamp: new Date().toLocaleTimeString(),
          chatId: currentChatId
        });
        previousState = currentStateStr;
      }
    }
  });
  
  console.log('📌 监控已启动，调用 stopMonitoring() 来停止监控');
  
  // 返回停止监控的函数
  window.stopMonitoring = unsubscribe;
}

// 检查当前状态
function checkCurrentState() {
  const state = window.__REDUX_STORE__?.getState();
  if (!state) {
    console.error('❌ 无法获取状态');
    return;
  }
  
  const currentChatId = state.chat.currentChatId;
  if (!currentChatId) {
    console.log('⚠️ 没有当前活跃的聊天');
    return;
  }
  
  const isGenerating = state.chat.isGenerating[currentChatId];
  const messageCardStatus = state.chat.messageCardStatus[currentChatId];
  const messagesCount = state.chat.chatData[currentChatId]?.messages?.length || 0;
  
  console.log('📊 当前状态:');
  console.log(`  - 聊天 ID: ${currentChatId}`);
  console.log(`  - 正在生成: ${isGenerating}`);
  console.log(`  - 消息卡片状态: ${messageCardStatus}`);
  console.log(`  - 消息数量: ${messagesCount}`);
  
  return {
    currentChatId,
    isGenerating,
    messageCardStatus,
    messagesCount
  };
}

// 导出测试函数到全局
window.testStopGeneration = testStopGeneration;
window.testImmediateStop = testImmediateStop;
window.monitorGenerationState = monitorGenerationState;
window.checkCurrentState = checkCurrentState;

// 使用说明
console.log(`
🧪 停止生成测试功能已加载！

可用的测试函数：

1. testStopGeneration() 
   - 发送消息，等待2秒后停止生成
   - 测试正常的停止流程

2. testImmediateStop()
   - 发送消息，立即停止（100ms后）
   - 测试快速停止的情况

3. monitorGenerationState()
   - 监控生成状态的实时变化
   - 调用 stopMonitoring() 来停止监控

4. checkCurrentState()
   - 检查当前聊天的状态信息

使用示例：
> testStopGeneration()
> monitorGenerationState()
> checkCurrentState()
`);
