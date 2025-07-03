# MessageCard 分隔符和测试消息功能 ✅

## 🎯 已完成的功能

### 1. **消息分隔符** 📏
在同一个MessageCard内的不同消息之间添加了美观的分隔符：

```tsx
// 分隔符组件结构
{!isLastMessage && (
  <div className="message-separator">
    <div className="separator-line"></div>
    <div className="separator-dot"></div>
  </div>
)}
```

**样式特点：**
- 渐变线条效果
- 中心圆点装饰  
- 与整体UI风格一致
- 只在非最后一条消息后显示

### 2. **Console测试脚本** 🧪
创建了功能完整的console脚本来添加测试消息：

**文件位置：** `add-test-message.js`

## 🚀 使用方法

### 在浏览器Console中运行：

```javascript
// 1. 复制整个 add-test-message.js 文件内容到console并回车

// 2. 使用快捷函数添加消息：

// 添加默认测试消息
addTestMessage()

// 添加用户消息
addUserMessage("这是一条用户消息")

// 添加AI助手消息（含思考过程）
addAssistantMessage("这是AI回复", "这是思考过程...")

// 添加工具调用消息
addToolMessage("工具执行结果")
```

## 🎨 分隔符样式详情

```less
.message-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 16px 0;
  position: relative;
  
  .separator-line {
    width: 100%;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      var(--border-color-split) 20%,
      var(--border-color-split) 80%,
      transparent
    );
    opacity: 0.6;
  }
  
  .separator-dot {
    position: absolute;
    width: 8px;
    height: 8px;
    background: var(--border-color-split);
    border-radius: 50%;
    border: 2px solid var(--background-content);
    opacity: 0.8;
    
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 4px;
      height: 4px;
      background: var(--background-content);
      border-radius: 50%;
    }
  }
}
```

## 🔧 测试脚本功能

### 主要特性：
- ✅ **自动消息ID生成**
- ✅ **支持所有消息类型** (user/assistant/tool/client-notice)
- ✅ **Markdown内容支持**
- ✅ **思考过程内容** (reasoning_content)
- ✅ **自动滚动到底部**
- ✅ **绿色边框标识测试消息**
- ✅ **完整的错误处理**

### 配置选项：
```javascript
const MESSAGE_CONFIG = {
  role: 'assistant',           // 消息角色
  content: '消息内容...',       // 主要内容
  reasoning_content: '思考...', // 思考过程（可选）
  tool_content: '工具结果...'   // 工具内容（可选）
};
```

## 📋 效果预览

### 分隔符效果：
```
消息 1 内容
┈┈┈┈┈┈● ┈┈┈┈┈┈  ← 分隔符
消息 2 内容
```

### 测试消息效果：
- 🟢 绿色边框包围
- 🧪 测试标识标签
- 📱 适配移动端
- 🎨 美观的样式

## 💡 使用建议

1. **测试消息显示**：使用console脚本快速添加测试内容
2. **分隔符验证**：发送包含多条消息的MessageCard来查看分隔符效果
3. **样式调试**：通过CSS变量调整分隔符颜色和样式

现在您可以：
- 看到MessageCard内不同消息之间的美观分隔符
- 使用console脚本快速添加测试消息进行调试
- 验证滚动条和自动滚动功能是否正常工作
