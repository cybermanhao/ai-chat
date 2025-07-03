# 🎯 多消息MessageCard分隔符测试指南

## 📋 目标
测试在单个MessageCard中显示多条消息时的分隔符视觉效果

## 🚀 使用步骤

### 第1步：加载脚本
1. 打开聊天页面
2. 按 `F12` 打开开发者工具
3. 点击 `Console` 标签
4. 复制整个 `add-test-message.js` 文件内容到console并回车

### 第2步：运行测试命令

#### 🎯 **核心测试命令**
```javascript
// 完整的3消息测试（推荐先运行这个）
addMultiMessageCard()

// 简单的2消息测试
addAssistantToolCard()  

// 复杂的3消息流程测试
addTripleMessageCard()

// 清理所有测试卡片
clearTestCards()
```

### 第3步：观察分隔符效果

#### ✅ **应该看到的效果：**
1. **分隔线**：消息之间有淡色渐变线条
2. **圆点装饰**：线条中央有小圆点
3. **间距适当**：消息之间有合理的间距
4. **样式一致**：所有分隔符外观统一

#### 📊 **测试的消息组合：**
- `addMultiMessageCard()`: Assistant(带思考) → Tool → Assistant
- `addAssistantToolCard()`: Assistant → Tool  
- `addTripleMessageCard()`: Assistant → Tool → Assistant

### 第4步：样式检查

#### 🎨 **分隔符CSS样式检查**
在Elements面板中查找 `.message-separator`：
```css
.message-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 16px 0;
}

.separator-line {
  /* 渐变线条 */
  background: linear-gradient(...)
}

.separator-dot {
  /* 中心圆点 */
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
```

## 🎮 **完整测试流程**

```javascript
// 1. 加载脚本后，运行基础测试
addMultiMessageCard()

// 2. 观察分隔符效果，然后添加更多测试
addAssistantToolCard()
addTripleMessageCard()

// 3. 检查页面效果，确认分隔符正常显示

// 4. 清理测试内容
clearTestCards()
```

## 🔍 **问题排查**

如果分隔符没有显示：
1. 检查CSS是否正确加载
2. 查看console是否有错误
3. 确认 `.message-separator` 样式是否存在
4. 检查CSS变量 `--border-color-split` 是否定义

## 📈 **预期结果**

成功运行后您应该看到：
- 🟦 蓝色边框的测试卡片  
- 🔀 消息之间的分隔符
- 📱 响应式的布局效果
- 🎨 统一的视觉风格

这样您就可以直观地测试和调整消息分隔符的效果了！
