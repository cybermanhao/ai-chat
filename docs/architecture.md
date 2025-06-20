# AI Chat 应用架构设计文档

## 1. 数据流设计

### 1.1 状态管理层次

```
全局状态 (Zustand Store)
  ↓
Context (UI状态)
  ↓
组件状态 (Local State)
```

#### 1.1.1 Zustand Store 职责
- `/store/chatStore.ts`: 聊天数据的持久化存储
- `/store/llmConfigStore.ts`: LLM配置管理
- `/store/modelConfigStore.ts`: 模型配置管理
- `/store/pluginStore.ts`: 插件状态管理
- `/store/themeStore.ts`: 主题配置

#### 1.1.2 Context 职责
- `/contexts/ModalContext.tsx`: 模态框状态管理
- `/contexts/ListSelectionContext.tsx`: 列表选择状态
- `/pages/Chat/context/ChatContext.tsx`: 聊天UI状态

### 1.2 Hook 设计

#### 1.2.1 数据操作 Hooks
- `useChatList`: 聊天列表管理
- `useChatMessages`: 消息操作与状态
- `useModelConfig`: 模型配置
- `useLLMConfig`: LLM设置

#### 1.2.2 功能型 Hooks
- `useModelSelection`: 模型选择逻辑
- `usePluginManager`: 插件管理
- `useTheme`: 主题切换

### 1.3 服务层设计
- `/services/chatStorage.ts`: 聊天数据持久化
- `/services/llmService.ts`: LLM通信
- `/services/mcpService.ts`: MCP协议实现

## 2. 文件结构职责

### 2.1 核心功能模块
```
/src
  /components  - 可复用UI组件
  /contexts    - React Context定义
  /hooks      - 自定义Hook
  /services   - 业务服务
  /store      - 全局状态
  /utils      - 工具函数
```

### 2.2 页面模块
```
/pages
  /Chat       - 聊天主界面
  /ChatList   - 聊天列表
  /Settings   - 设置页面
  /Plugins    - 插件管理
```

## 3. 架构问题分析

### 3.1 当前存在的问题

1. Context/Store 职责重叠
```typescript
// ChatContext.tsx 中包含了数据状态
export interface ChatContextType {
  chatList: ChatInfo[];  // 应该放在 store 中
  chatId: string;        // 应该放在 store 中
  // ...
}
```

2. Ref 管理混乱
```typescript
// ChatContext 中的 DOM 引用应该独立
activeChatRef: React.RefObject<HTMLDivElement | null>;
```

3. 状态更新耦合
- 消息状态更新同时触发多个 store 更新
- UI 状态和数据状态未完全分离

### 3.2 改进建议

1. Context 重构
```typescript
// 建议的 ChatContext 结构
export interface ChatContextType {
  // UI 状态
  isGenerating: boolean;
  scrollPosition: number;
  
  // 视图控制
  scrollToBottom: () => void;
  setGenerating: (status: boolean) => void;
}
```

2. Store 职责明确化
```typescript
// chatStore.ts
interface ChatStore {
  chats: Record<string, ChatInfo>;
  messages: Record<string, ChatMessage[]>;
  currentChatId: string | null;
  
  // 操作方法
  addChat: (chat: ChatInfo) => void;
  addMessage: (chatId: string, message: ChatMessage) => void;
}
```

3. 服务层抽象
```typescript
// 建议的服务层结构
interface ChatService {
  sendMessage: (content: string) => Promise<void>;
  loadHistory: (chatId: string) => Promise<ChatMessage[]>;
  saveChat: (chat: ChatInfo) => Promise<void>;
}
```

## 4. 最佳实践建议

1. 状态管理原则
- Store: 持久化数据、全局共享状态
- Context: UI状态、临时状态
- Local State: 组件内部状态

2. 数据流向
- 单向数据流
- Props Down, Events Up
- 避免状态提升过高

3. 组件设计
- 保持组件纯函数特性
- 使用 React.memo 优化渲染
- 合理拆分业务逻辑和UI逻辑

4. Hook 设计
- 单一职责
- 可复用性
- 性能优化
