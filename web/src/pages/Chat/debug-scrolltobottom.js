// 在浏览器 Console 中运行这些调试命令来检查 scrollToBottom 的目标

// 1. 检查完整的容器层次结构
console.log('=== 容器层次结构检查 ===');
const chatPage = document.querySelector('.chat-page');
const chatContent = document.querySelector('.chat-content');
const messageList = document.querySelector('.message-list');
const inputSender = document.querySelector('.input-sender');

console.log('Chat Page:', chatPage);
console.log('Chat Content:', chatContent);
console.log('MessageList:', messageList);
console.log('InputSender:', inputSender);

// 2. 检查各容器的尺寸
if (chatPage && chatContent && messageList) {
  console.log('=== 容器尺寸信息 ===');
  console.log('Chat Page dimensions:', {
    offsetHeight: chatPage.offsetHeight,
    clientHeight: chatPage.clientHeight,
    scrollHeight: chatPage.scrollHeight
  });
  
  console.log('Chat Content dimensions:', {
    offsetHeight: chatContent.offsetHeight,
    clientHeight: chatContent.clientHeight,
    scrollHeight: chatContent.scrollHeight,
    computedHeight: getComputedStyle(chatContent).height
  });
  
  console.log('MessageList dimensions:', {
    offsetHeight: messageList.offsetHeight,
    clientHeight: messageList.clientHeight,
    scrollHeight: messageList.scrollHeight,
    canScroll: messageList.scrollHeight > messageList.clientHeight,
    overflowY: getComputedStyle(messageList).overflowY
  });
}

// 3. 测试手动滚动
if (messageList) {
  console.log('=== 滚动测试 ===');
  const oldScrollTop = messageList.scrollTop;
  messageList.scrollTop = messageList.scrollHeight;
  console.log('滚动前:', oldScrollTop);
  console.log('滚动后:', messageList.scrollTop);
  console.log('滚动是否生效:', messageList.scrollTop !== oldScrollTop);
}

// 4. 检查CSS样式是否正确应用
if (messageList) {
  console.log('=== CSS样式检查 ===');
  const computedStyle = getComputedStyle(messageList);
  console.log('MessageList computed styles:', {
    display: computedStyle.display,
    flexDirection: computedStyle.flexDirection,
    flex: computedStyle.flex,
    overflowY: computedStyle.overflowY,
    height: computedStyle.height,
    minHeight: computedStyle.minHeight,
    maxHeight: computedStyle.maxHeight
  });
}

// 5. 添加测试内容（如果需要）
if (messageList && messageList.scrollHeight <= messageList.clientHeight) {
  console.log('=== 添加测试内容 ===');
  const testDiv = document.createElement('div');
  testDiv.style.cssText = 'height: 1000px; background: linear-gradient(to bottom, #ff0000, #0000ff); opacity: 0.3; margin: 10px 0;';
  testDiv.textContent = '测试滚动内容 - 如果看到这个说明内容不足以触发滚动';
  messageList.appendChild(testDiv);
  console.log('测试内容已添加，现在应该可以看到滚动条了');
}
