# MCP系统重构分析与待完成功能

## 当前状态评估

### ✅ 已完成的功能
1. **UI界面** ✅
   - MCP服务器列表展示
   - 服务器添加/删除功能
   - 连接状态指示器（绿色/红色圆点）
   - 连接/断开Switch控件
   - 工具列表展示（Collapse）
   - 工具管理模态框

2. **现代化Redux状态管理** ✅ **已完全现代化**
   - ✅ 使用Redux Toolkit (`createSlice`, `createAsyncThunk`)
   - ✅ 完整TypeScript类型定义
   - ✅ 异步状态管理 (pending/fulfilled/rejected)
   - ✅ MCPServer接口定义和MCPTool扩展接口
   - ✅ 合理的actions: addServer, removeServer, setActiveServer, connectServer, disconnectServer
   - ✅ extraReducers处理异步操作
   - ✅ 不可变状态更新（内置Immer）

3. **基础服务层框架** 🔄
   - MCPService类框架
   - MCPTool类型定义
   - 传输层抽象设计

### ❌ 需要完成的核心功能

#### 1. MCP连接服务实现 (高优先级)
```typescript
// 需要在 web/src/services/mcpService.ts 中实现
class MCPConnectionService {
  async connectToServer(serverId: string, url: string): Promise<ConnectionResult>
  async disconnectFromServer(serverId: string): Promise<void>
  async listTools(serverId: string): Promise<Tool[]>
  async callTool(serverId: string, toolName: string, args: any): Promise<ToolResult>
}
```

#### 2. ~~Redux异步Thunks~~ ✅ **已完成**
```typescript
// ✅ 已实现 - web/src/store/mcpStore.ts
export const connectServer = createAsyncThunk(...)     // ✅ 完成
export const disconnectServer = createAsyncThunk(...)  // ✅ 完成
// export const refreshServerTools = createAsyncThunk(...) // 可选扩展
```

#### 3. MCP客户端传输层 (高优先级)
- StreamableHTTP传输实现
- WebSocket传输备选方案
- 错误处理和重连机制

#### 4. 工具调用集成 (中优先级)
- 聊天系统中的MCP工具调用
- 工具结果展示
- 工具权限管理

#### 5. 会话管理 (中优先级)
- MCP会话状态维护
- 多服务器并发连接
- 会话恢复机制

## 架构改进建议

### 1. 服务层重构
```
web/src/services/
├── mcpService.ts           (主要MCP服务)
├── mcpTransport.ts         (传输层抽象)
├── mcpConnectionManager.ts (连接管理器)
└── mcpToolRegistry.ts      (工具注册表)
```

### 2. Store结构优化 ✅ **已优化**
```typescript
// ✅ 当前结构已经很好
interface MCPState {
  servers: MCPServer[];           // ✅ 合理的扁平结构
  activeServerId?: string;        // ✅ 活动服务器管理
  isLoading: boolean;            // ✅ 全局加载状态
}

interface MCPServer {
  id: string;
  name: string;
  url: string;
  isConnected: boolean;          // ✅ 连接状态
  loading: boolean;              // ✅ 单个服务器加载状态
  tools: MCPTool[];             // ✅ 工具列表
  error?: string;               // ✅ 错误处理
}
```

### 3. 错误处理策略
- 统一的错误类型定义
- 用户友好的错误提示
- 自动重试机制
- 降级策略

## 技术债务清理

### 1. 类型定义统一
- 统一MCPTool和Tool类型
- 完善错误类型定义
- 添加缺失的TypeScript类型

### 2. 代码组织
- 移除注释掉的旧代码
- 统一命名规范
- 添加适当的JSDoc注释

### 3. 测试覆盖
- 单元测试（服务层）
- 集成测试（MCP连接）
- E2E测试（UI交互）

## 实现计划

### 阶段1: 核心连接功能 (1-2天)
1. 实现MCPConnectionService
2. 添加Redux异步thunks
3. 完善UI连接状态反馈

### 阶段2: 工具管理 (1天)
1. 工具列表刷新
2. 工具启用/禁用
3. 工具调用接口

### 阶段3: 聊天集成 (2-3天)
1. 聊天中的MCP工具调用
2. 工具结果展示
3. 多轮对话支持

### 阶段4: 优化与完善 (1-2天)
1. 错误处理优化
2. 性能优化
3. 用户体验改进

## 风险评估

### 高风险
- MCP协议兼容性问题
- 跨域请求处理
- 连接稳定性

### 中风险
- 工具调用性能
- 内存泄漏风险
- UI响应性

### 低风险
- 样式兼容性
- 配置管理
- 日志记录

## 下一步行动

1. **立即执行**: 完善`handleToggleConnection`函数的实际连接逻辑
2. **本周内**: 实现MCPConnectionService基础功能
3. **下周**: 完成聊天系统集成
4. **持续**: 编写测试用例和文档

---

*最后更新: 2025-07-02*
*负责人: AI Assistant*
*状态: 分析完成，等待实施*
