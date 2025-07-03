// Console脚本：向当前聊天添加包含多条消息的MessageCard

/**
 * 在最后一个MessageCard下添加一个包含多条消息的MessageCard
 * 主要用于测试消息分隔符的视觉效果
 * 使用方法：在浏览器Console中粘贴并运行此脚本
 */

// 主要函数：添加包含多条消息的MessageCard
function addMultiMessageCard() {
  console.log('🚀 开始添加多消息MessageCard...');
  
  try {
    const messageList = document.querySelector('.message-list');
    if (!messageList) {
      throw new Error('未找到聊天页面，请确保您在聊天页面中运行此脚本');
    }
    
    // 创建包含多条消息的MessageCard HTML
    const multiMessageCardHTML = createMultiMessageCardHTML();
    
    // 创建临时容器
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = multiMessageCardHTML;
    const newMessageCard = tempDiv.firstElementChild;
    
    // 添加到消息列表
    messageList.appendChild(newMessageCard);
    
    // 滚动到底部
    setTimeout(() => {
      messageList.scrollTo({
        top: messageList.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
    
    console.log('✅ 多消息MessageCard添加成功！');
    console.log('🎯 现在您可以看到消息分隔符的效果了！');
    
  } catch (error) {
    console.error('❌ 添加多消息MessageCard失败:', error);
  }
}

// 生成包含多条消息的MessageCard HTML
function createMultiMessageCardHTML() {
  return `
    <div class="message-card-group" style="border: 2px solid #1890ff; border-radius: 8px; background: rgba(24, 144, 255, 0.1);">
      <div class="message-status-bar">
        <div class="message-status" style="background: #1890ff; color: white;">
          🎯 多消息测试 - 测试分隔符效果
        </div>
      </div>
      
      <!-- 第1条消息 - Assistant -->
      <div class="message-card message-assistant">
        <div class="message-header">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #f6ffed; display: flex; align-items: center; justify-content: center; font-size: 14px;">
            🤖
          </div>
        </div>
        <div class="message-content">
          <div class="reasoning-section">
            <div class="reasoning-header" style="cursor: pointer; color: #666; font-size: 14px; margin-bottom: 8px;">
              💭 思考过程
            </div>
            <div class="reasoning-content" style="background: #f8f9fa; padding: 12px; border-radius: 6px; font-size: 13px; color: #666;">
              这是第一条消息的思考过程：<br>
              1. 分析用户需求<br>
              2. 准备调用工具<br>
              3. 开始执行任务
            </div>
          </div>
          <div class="main-content-container">
            <div class="main-content">
              <div class="markdown-content" style="padding: 12px 0;">
                <strong>第1条消息 - AI助手回复</strong><br><br>
                我需要调用一些工具来帮助您完成任务。让我开始处理...
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 消息分隔符 -->
      <div class="message-separator">
        <div class="separator-line"></div>
        <div class="separator-dot"></div>
      </div>
      
      <!-- 第2条消息 - Tool -->
      <div class="message-card message-tool">
        <div class="message-header">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #fffbe6; display: flex; align-items: center; justify-content: center; font-size: 14px;">
            🔧
          </div>
        </div>
        <div class="message-content">
          <div class="main-content-container">
            <div class="main-content">
              <div class="markdown-content" style="padding: 12px 0;">
                <strong>第2条消息 - 工具执行结果</strong><br><br>
                <code>工具调用成功</code><br>
                返回数据：<br>
                <pre style="background: #f5f5f5; padding: 8px; border-radius: 4px; margin: 8px 0;">
{
  "status": "success",
  "data": [1, 2, 3, 4, 5],
  "timestamp": "${new Date().toISOString()}"
}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 消息分隔符 -->
      <div class="message-separator">
        <div class="separator-line"></div>
        <div class="separator-dot"></div>
      </div>
      
      <!-- 第3条消息 - Assistant -->
      <div class="message-card message-assistant">
        <div class="message-header">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #f6ffed; display: flex; align-items: center; justify-content: center; font-size: 14px;">
            🤖
          </div>
        </div>
        <div class="message-content">
          <div class="reasoning-section">
            <div class="reasoning-header" style="cursor: pointer; color: #666; font-size: 14px; margin-bottom: 8px;">
              💭 思考过程
            </div>
            <div class="reasoning-content" style="background: #f8f9fa; padding: 12px; border-radius: 6px; font-size: 13px; color: #666;">
              分析工具执行结果：<br>
              1. 检查工具调用状态 - ✅ 成功<br>
              2. 验证返回数据格式 - ✅ JSON格式正确<br>
              3. 分析数据内容 - 包含时间戳和数组数据<br>
              4. 准备总结回复 - 整理处理结果
            </div>
          </div>
          <div class="main-content-container">
            <div class="main-content">
              <div class="markdown-content" style="padding: 12px 0;">
                **第3条消息 - AI最终回复**<br><br>
                基于工具的执行结果，我已经完成了任务。<br><br>
                ## 处理结果<br>
                - ✅ 工具调用成功<br>
                - ✅ 数据处理完成<br>
                - ✅ 结果验证通过<br><br>
                > 💡 **总结**：所有步骤都已成功完成！
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}


// 配置对象
const MESSAGE_CONFIG = {
  role: 'assistant',
  content: '',
  reasoning_content: null
};

// 基础函数：添加单条消息
function addTestMessage() {
  console.log('📝 添加测试消息...');
  
  try {
    const messageList = document.querySelector('.message-list');
    if (!messageList) {
      throw new Error('未找到聊天页面，请确保您在聊天页面中运行此脚本');
    }
    
    const messageHTML = createSingleMessageHTML();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = messageHTML;
    const newMessage = tempDiv.firstElementChild;
    
    messageList.appendChild(newMessage);
    
    setTimeout(() => {
      messageList.scrollTo({
        top: messageList.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
    
    console.log(`✅ ${MESSAGE_CONFIG.role} 消息添加成功！`);
    
  } catch (error) {
    console.error('❌ 添加消息失败:', error);
  }
}

// 生成单条消息HTML
function createSingleMessageHTML() {
  const roleMap = {
    user: { emoji: '👤', bg: '#e6f7ff', name: '用户' },
    assistant: { emoji: '🤖', bg: '#f6ffed', name: 'AI助手' },
    tool: { emoji: '🔧', bg: '#fffbe6', name: '工具' }
  };
  
  const roleInfo = roleMap[MESSAGE_CONFIG.role] || roleMap.assistant;
  
  const reasoningSection = MESSAGE_CONFIG.reasoning_content ? `
    <div class="reasoning-section">
      <div class="reasoning-header" style="cursor: pointer; color: #666; font-size: 14px; margin-bottom: 8px;">
        💭 思考过程
      </div>
      <div class="reasoning-content" style="background: #f8f9fa; padding: 12px; border-radius: 6px; font-size: 13px; color: #666;">
        ${MESSAGE_CONFIG.reasoning_content}
      </div>
    </div>
  ` : '';
  
  return `
    <div class="message-card message-${MESSAGE_CONFIG.role}" style="border: 2px solid #52c41a; border-radius: 8px; background: rgba(82, 196, 26, 0.1);">
      <div class="message-header">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: ${roleInfo.bg}; display: flex; align-items: center; justify-content: center; font-size: 14px;">
          ${roleInfo.emoji}
        </div>
        <div style="background: #52c41a; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px;">
          🧪 测试消息 - ${roleInfo.name}
        </div>
      </div>
      <div class="message-content">
        ${reasoningSection}
        <div class="main-content-container">
          <div class="main-content">
            <div class="markdown-content" style="padding: 12px 0;">
              ${MESSAGE_CONFIG.content}
              <br><br>
              <small style="color: #999;">⏰ 测试时间: ${new Date().toLocaleString()}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 快捷函数
function addUserMessage(content) {
  MESSAGE_CONFIG.role = 'user';
  MESSAGE_CONFIG.content = content || '这是一条用户测试消息';
  MESSAGE_CONFIG.reasoning_content = null;
  addTestMessage();
}

function addAssistantMessage(content, reasoning) {
  MESSAGE_CONFIG.role = 'assistant';
  MESSAGE_CONFIG.content = content || '这是一条AI助手测试消息';
  MESSAGE_CONFIG.reasoning_content = reasoning || null;
  addTestMessage();
}

function addToolMessage(content) {
  MESSAGE_CONFIG.role = 'tool';
  MESSAGE_CONFIG.content = content || '这是一条工具调用结果';
  MESSAGE_CONFIG.reasoning_content = null;
  addTestMessage();
}

// 快捷函数：不同类型的多消息测试
function addAssistantToolCard() {
  console.log('🤖 添加 Assistant + Tool 组合卡片...');
  const html = `
    <div class="message-card-group" style="border: 2px solid #ff7a00; border-radius: 8px; background: rgba(255, 122, 0, 0.1);">
      <div class="message-status-bar">
        <div class="message-status" style="background: #ff7a00; color: white;">
          🤖🔧 Assistant + Tool 组合测试
        </div>
      </div>
      
      <div class="message-card message-assistant">
        <div class="message-header">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #f6ffed; display: flex; align-items: center; justify-content: center;">🤖</div>
        </div>
        <div class="message-content">
          <div class="main-content-container">
            <div class="main-content">
              <div class="markdown-content" style="padding: 12px 0;">我需要调用工具来查询天气信息...</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="message-separator">
        <div class="separator-line"></div>
        <div class="separator-dot"></div>
      </div>
      
      <div class="message-card message-tool">
        <div class="message-header">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #fffbe6; display: flex; align-items: center; justify-content: center;">🔧</div>
        </div>
        <div class="message-content">
          <div class="main-content-container">
            <div class="main-content">
              <div class="markdown-content" style="padding: 12px 0;">
                <strong>天气查询工具</strong><br>
                查询结果：北京今天晴天，温度 25°C
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const messageList = document.querySelector('.message-list');
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  messageList.appendChild(tempDiv.firstElementChild);
  
  setTimeout(() => messageList.scrollTo({ top: messageList.scrollHeight, behavior: 'smooth' }), 100);
}

function addTripleMessageCard() {
  console.log('🎯 添加三消息组合卡片...');
  const html = `
    <div class="message-card-group" style="border: 2px solid #722ed1; border-radius: 8px; background: rgba(114, 46, 209, 0.1);">
      <div class="message-status-bar">
        <div class="message-status" style="background: #722ed1; color: white;">
          🎯 三消息分隔符测试 (Assistant → Tool → Assistant)
        </div>
      </div>
      
      <div class="message-card message-assistant">
        <div class="message-header">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #f6ffed; display: flex; align-items: center; justify-content: center;">🤖</div>
        </div>
        <div class="message-content">
          <div class="main-content-container">
            <div class="main-content">
              <div class="markdown-content" style="padding: 12px 0;"><strong>第1步</strong>：我来帮您计算这个数学问题...</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="message-separator">
        <div class="separator-line"></div>
        <div class="separator-dot"></div>
      </div>
      
      <div class="message-card message-tool">
        <div class="message-header">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #fffbe6; display: flex; align-items: center; justify-content: center;">🔧</div>
        </div>
        <div class="message-content">
          <div class="main-content-container">
            <div class="main-content">
              <div class="markdown-content" style="padding: 12px 0;">
                <strong>计算器工具</strong><br>
                输入：2 + 3 × 4<br>
                输出：14
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="message-separator">
        <div class="separator-line"></div>
        <div class="separator-dot"></div>
      </div>
      
      <div class="message-card message-assistant">
        <div class="message-header">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #f6ffed; display: flex; align-items: center; justify-content: center;">🤖</div>
        </div>
        <div class="message-content">
          <div class="main-content-container">
            <div class="main-content">
              <div class="markdown-content" style="padding: 12px 0;">
                <strong>第3步</strong>：根据计算结果，答案是 <code>14</code>。<br><br>
                计算过程：先算乘法 3×4=12，再算加法 2+12=14
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const messageList = document.querySelector('.message-list');
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  messageList.appendChild(tempDiv.firstElementChild);
  
  setTimeout(() => messageList.scrollTo({ top: messageList.scrollHeight, behavior: 'smooth' }), 100);
}

function clearTestCards() {
  const testCards = document.querySelectorAll('[style*="border: 2px solid"]');
  testCards.forEach(card => card.remove());
  console.log(`🧹 已清理 ${testCards.length} 个测试卡片`);
}

// 导出到全局作用域
window.addTestMessage = addTestMessage;
window.addUserMessage = addUserMessage;
window.addAssistantMessage = addAssistantMessage;
window.addToolMessage = addToolMessage;
window.addMultiMessageCard = addMultiMessageCard;
window.addAssistantToolCard = addAssistantToolCard;
window.addTripleMessageCard = addTripleMessageCard;
window.clearTestCards = clearTestCards;

// 使用说明
console.log(`
🎯 多消息MessageCard测试脚本已加载！

📖 单条消息测试：
- addTestMessage()                                    // 添加默认测试消息
- addUserMessage("你好！")                             // 添加用户消息
- addAssistantMessage("你好！我是AI助手", "思考过程...")   // 添加AI消息（可选思考过程）
- addToolMessage("工具执行结果")                       // 添加工具消息

🎉 多消息MessageCard测试（重点功能）：
- addMultiMessageCard()     // 3条消息的完整测试卡片（AI→工具→AI）
- addAssistantToolCard()    // 2条消息：AI + 工具
- addTripleMessageCard()    // 3条消息：AI → 工具 → AI
- clearTestCards()          // 清理所有测试卡片

💡 提示：
- 所有消息会添加到当前聊天的最底部
- 测试消息有彩色边框标识
- 重点测试多消息卡片中的分隔符效果
- 支持自动滚动到底部

🚀 快速开始：运行 addMultiMessageCard() 来测试消息分隔符效果！
`);

// 如果是直接运行，则自动添加一条测试消息
if (typeof window !== 'undefined' && window.document) {
  console.log('🎉 脚本加载完成，建议运行 addMultiMessageCard() 来测试分隔符效果！');
}
