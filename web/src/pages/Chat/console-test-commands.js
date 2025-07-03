// 🎯 Console测试命令大全 - 复制到浏览器Console中运行

// ===== 第1步：先运行 add-test-message.js 全部内容 =====
// （复制整个文件内容到console，然后按回车）

// ===== 第2步：使用以下命令测试不同效果 =====

// 🧪 基础测试
addTestMessage()  // 添加默认测试消息

// 👤 用户消息测试
addUserMessage("你好，我想测试一下界面效果！")
addUserMessage("这是一条很长很长很长的用户消息，用来测试消息显示的换行效果和布局是否正常工作。")

// 🤖 AI助手消息测试
addAssistantMessage("你好！我是AI助手，很高兴为您服务。")
addAssistantMessage(
  "这是一条包含思考过程的AI回复", 
  "思考过程：1. 分析用户问题 2. 构思回答 3. 生成回复"
)

// 🤖 带Markdown的AI消息
addAssistantMessage(`
# 这是一个Markdown测试

## 功能展示
- **粗体文本**
- *斜体文本*
- \`行内代码\`

### 代码块示例
\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

### 列表测试
1. 第一项
2. 第二项
3. 第三项

> 这是一个引用块
> 用来测试样式效果

### 表格测试
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| A   | B   | C   |
| 1   | 2   | 3   |
`)

// 🔧 工具消息测试
addToolMessage("工具执行成功，结果如下：\n{\n  \"status\": \"success\",\n  \"data\": \"测试数据\"\n}")

// 📊 多条消息测试（测试分隔符效果）
addUserMessage("请帮我分析一下数据")
addAssistantMessage("好的，我来为您分析", "正在分析用户提供的数据...")
addToolMessage("数据分析工具执行完成")
addAssistantMessage("分析结果：数据质量良好")

// 🎨 视觉效果测试
addAssistantMessage(`
🎨 **视觉效果测试**

这条消息用来测试各种视觉元素：

### 1. 颜色和样式
- 🟢 绿色：正常状态
- 🟡 黄色：警告状态  
- 🔴 红色：错误状态
- 🔵 蓝色：信息状态

### 2. 图标和符号
- ✅ 成功
- ❌ 失败
- ⚠️ 警告
- 📊 数据
- 🔧 工具
- 💡 提示

### 3. 代码和技术内容
\`\`\`json
{
  "test": "视觉效果",
  "status": "success",
  "timestamp": "${new Date().toISOString()}"
}
\`\`\`

### 4. 长文本测试
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

这是一段很长的中文文本，用来测试文本换行、行高、字体渲染等效果是否正常。包含了各种标点符号：！@#￥%……&*（）——+{}|："<>?[];'.,/

### 5. 混合内容
1. **项目管理**：使用 \`React\` + \`TypeScript\`
2. **状态管理**：采用 \`Redux Toolkit\`  
3. **样式方案**：使用 \`Less\` + \`Ant Design\`
4. **构建工具**：基于 \`Vite\`

> 💡 **提示**：这些内容用来测试MessageCard的各种渲染效果
`)

// 🔄 批量测试（快速添加多条消息）
function addBatchMessages() {
  console.log("🔄 开始批量添加消息...");
  
  const messages = [
    { role: 'user', content: '第1条用户消息' },
    { role: 'assistant', content: '第1条AI回复' },
    { role: 'user', content: '第2条用户消息' },
    { role: 'assistant', content: '第2条AI回复，内容稍长一些，用来测试不同长度的消息显示效果' },
    { role: 'tool', content: '工具执行结果' },
    { role: 'assistant', content: '基于工具结果的最终回复' }
  ];
  
  messages.forEach((msg, index) => {
    setTimeout(() => {
      if (msg.role === 'user') {
        addUserMessage(msg.content);
      } else if (msg.role === 'assistant') {
        addAssistantMessage(msg.content);
      } else if (msg.role === 'tool') {
        addToolMessage(msg.content);
      }
    }, index * 500); // 每500ms添加一条
  });
}

// 🧹 清理测试消息
function clearTestMessages() {
  const testMessages = document.querySelectorAll('[style*="border: 2px solid #52c41a"]');
  testMessages.forEach(msg => msg.remove());
  console.log(`🧹 已清理 ${testMessages.length} 条测试消息`);
}

// 📊 检查消息数量
function checkMessageCount() {
  const allMessages = document.querySelectorAll('.message-card-group');
  const testMessages = document.querySelectorAll('[style*="border: 2px solid #52c41a"]');
  console.log(`📊 消息统计:
  - 总消息数: ${allMessages.length}
  - 测试消息数: ${testMessages.length}
  - 正常消息数: ${allMessages.length - testMessages.length}`);
}

// 🎯 焦点测试
function focusLastMessage() {
  const messageList = document.querySelector('.message-list');
  if (messageList) {
    messageList.scrollTo({
      top: messageList.scrollHeight,
      behavior: 'smooth'
    });
    console.log('🎯 已滚动到最新消息');
  }
}

// 导出批量测试函数
window.addBatchMessages = addBatchMessages;
window.clearTestMessages = clearTestMessages;
window.checkMessageCount = checkMessageCount;
window.focusLastMessage = focusLastMessage;

console.log(`
🎮 **扩展测试命令已加载！**

📋 **快速测试菜单：**

🧪 **基础测试：**
- addTestMessage()
- addUserMessage("用户消息")  
- addAssistantMessage("AI消息")
- addToolMessage("工具消息")

🎨 **视觉效果测试：**
- 运行上面的Markdown测试命令
- 运行视觉效果测试命令

🔄 **批量操作：**
- addBatchMessages()     // 批量添加6条消息
- clearTestMessages()    // 清理所有测试消息
- checkMessageCount()    // 查看消息统计
- focusLastMessage()     // 滚动到最新消息

💡 **推荐测试流程：**
1. 先运行几个基础命令看整体效果
2. 运行 addBatchMessages() 测试分隔符
3. 运行 Markdown 测试看渲染效果
4. 最后用 clearTestMessages() 清理
`);
