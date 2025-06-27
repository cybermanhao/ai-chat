# Engine Hooks 迁移总结

## 迁移概述

本次迁移将 `engine/hooks` 中的 React hooks 完全移除，将业务逻辑迁移到纯函数和 class 中，实现了现代 Redux 架构的最佳实践。

## 迁移内容

### 1. 目录结构重构

#### 新增目录：
- `engine/stream/` - 流处理相关模块
  - `streamHandler.ts` - 流式数据处理
  - `streamManager.ts` - 流管理器
  - `streamAccumulator.ts` - 工具调用累积器
  - `webStreamHandler.ts` - Web 流处理器
  - `index.ts` - 统一导出

- `engine/managers/` - 业务管理器
  - `MessageManager.ts` - 消息管理器
  - `ToolCallManager.ts` - 工具调用管理器
  - `index.ts` - 统一导出

- `engine/services/` - 服务层
  - `ErrorHandler.ts` - 错误处理服务
  - `index.ts` - 统一导出

#### 保留目录：
- `engine/utils/` - 纯工具函数（markdown、xml、llms 等）
- `engine/types/` - 类型定义
- `engine/store/` - Redux store

### 2. 核心迁移

#### 从 React Hooks 到纯函数：

1. **useToolCallHandler** → `engine/managers/ToolCallManager.ts`
   - 工具调用逻辑迁移为纯函数
   - 支持单个和批量工具调用处理

2. **useLLMStreamManager** → `engine/stream/streamManager.ts`
   - 流式处理逻辑迁移为纯函数
   - 支持流式数据累积和处理

3. **ChatMessageManager** → `engine/managers/MessageManager.ts`
   - 消息管理逻辑迁移为 class
   - 提供静态工厂方法和实例方法

4. **错误处理** → `engine/services/ErrorHandler.ts`
   - 统一错误处理服务
   - 支持错误代码和上下文

#### 流处理模块化：

1. **streamHandler.ts** - 基础流处理
2. **streamAccumulator.ts** - 工具调用累积
3. **webStreamHandler.ts** - Web 平台适配
4. **streamManager.ts** - 流管理器

### 3. 类型系统优化

#### 消息状态扩展：
```typescript
export type MessageStatus = 'connecting' | 'thinking' | 'generating' | 'tool_calling' | 'stable' | 'done' | 'error';
```

新增 `tool_calling` 状态，支持工具调用过程中的状态管理。

### 4. Web 层适配

#### Import 路径更新：
- `@engine/utils/ChatMessageManager` → `@engine/managers/MessageManager`
- `@engine/utils/webLLMStreamHandler` → `@engine/stream/webStreamHandler`
- `@engine/utils/toolCallAccumulator` → `@engine/stream/streamAccumulator`
- `@engine/utils/streamHandler` → `@engine/stream/streamHandler`

#### 删除的文件：
- `web/src/chat/WebChatSession.ts` - 存在复杂类型兼容问题，需要重新设计

## 架构优势

### 1. 职责分离
- **Engine 层**：纯业务逻辑，无 UI 依赖
- **Web 层**：UI 逻辑，使用 Redux hooks 访问状态

### 2. 可测试性
- 所有业务逻辑都是纯函数/class，易于单元测试
- 无 React hooks 依赖，测试更简单

### 3. 可复用性
- Engine 层可在不同平台复用（Web、Electron、Node.js）
- 模块化设计，支持按需导入

### 4. 类型安全
- 统一的类型定义
- 完整的 TypeScript 支持

## 后续建议

### 1. 继续清理
- 检查并清理其他可能的 React hooks 残留
- 确保所有业务逻辑都在 engine 层

### 2. 测试覆盖
- 为新的纯函数/class 添加单元测试
- 确保迁移后的功能完整性

### 3. 文档完善
- 更新 API 文档
- 添加使用示例

### 4. 性能优化
- 监控流处理性能
- 优化内存使用

## 总结

本次迁移成功实现了：
- ✅ 完全移除 engine/hooks 中的 React hooks
- ✅ 业务逻辑迁移到纯函数/class
- ✅ 目录结构按职责重新组织
- ✅ 类型系统优化和统一
- ✅ Web 层适配（部分完成）

架构现在符合现代 Redux + 纯函数的最佳实践，为后续的功能扩展和维护奠定了良好基础。 