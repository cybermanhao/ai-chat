# 自动滚动设置功能

## 📋 功能概述

在左侧面板的设置中添加了"自动滚动"开关，允许用户控制聊天界面的自动滚动行为。

## 🎛️ 控制逻辑

### 始终滚动（不受设置影响）
- ✅ **新消息添加时**：无论设置如何，新消息时始终自动滚动
- ✅ **发送消息后**：发送消息后始终滚动到底部，确保用户能看到自己的消息

### 可控制滚动（受设置影响）
- 🎛️ **流式更新时**：assistant 消息内容变化时的滚动（用于实时查看生成内容）
- 🎛️ **生成状态变化时**：isGenerating 状态变化时的滚动

## 💾 技术实现

### 1. Redux Store 扩展
在 `chatSlice.ts` 中添加：
```typescript
interface ChatState {
  // ...existing code...
  settings: {
    autoScroll: boolean; // 自动滚动开关
  };
}

// 新 action
setAutoScroll(state: ChatState, action: PayloadAction<boolean>) {
  state.settings.autoScroll = action.payload;
}
```

### 2. 设置页面集成
在 `Settings/index.tsx` 中添加：
```tsx
<Form.Item 
  label="自动滚动" 
  name="autoScroll"
  extra="开启后，在流式输出和状态变化时自动滚动到底部"
>
  <Switch checked={autoScroll} onChange={v => dispatch(setAutoScroll(v))} />
</Form.Item>
```

### 3. 聊天页面逻辑
在 `Chat/index.tsx` 中：
```tsx
// 流式更新时的可控滚动
useEffect(() => {
  if (autoScroll && chatData?.messages) {
    const lastMessage = chatData.messages[chatData.messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      // 滚动逻辑
    }
  }
}, [chatData?.messages, scrollToBottom, autoScroll]);

// 生成状态变化时的可控滚动
useEffect(() => {
  if (autoScroll && isGenerating) {
    // 滚动逻辑
  }
}, [isGenerating, scrollToBottom, autoScroll]);
```

## 🧪 测试说明

### 启用自动滚动（默认状态）
1. 发送消息 → 应该滚动到底部
2. AI 回复过程中 → 应该实时滚动跟随内容
3. 状态变化时 → 应该自动滚动

### 禁用自动滚动
1. 发送消息 → 仍然滚动到底部（不受影响）
2. AI 回复过程中 → 不会自动滚动，需要手动查看
3. 状态变化时 → 不会自动滚动

## 🎯 用户体验

### 适合启用自动滚动的场景
- 正常聊天交互
- 希望实时查看 AI 生成内容
- 不需要回看历史消息

### 适合禁用自动滚动的场景
- 正在查看历史消息时不希望被打断
- 需要对比多条消息内容
- 性能敏感场景（减少 DOM 操作）

## 📈 性能影响

### 禁用自动滚动的好处
- 减少 DOM 操作频率
- 降低 requestAnimationFrame 调用
- 可能减轻 DOM 闪烁问题
- 提升低端设备性能

## 🔧 相关文件

- `web/src/store/chatSlice.ts` - Redux 状态管理
- `web/src/pages/Settings/index.tsx` - 设置界面
- `web/src/pages/Chat/index.tsx` - 聊天页面逻辑

## 🚀 后续优化建议

1. **持久化设置**：将设置保存到 localStorage
2. **每个聊天独立设置**：不同聊天可以有不同的滚动偏好
3. **滚动行为细化**：区分不同类型的滚动（平滑、瞬间等）
4. **智能滚动**：检测用户是否在查看历史，自动暂停滚动

自动滚动设置功能实装完成 ✅
