# MCP服务集成指南

本文档介绍如何在Web应用中使用MCP (Model Context Protocol) 服务。

## 概述

我们已经将MCP服务从模拟实现升级为真实的连接实现，现在可以与实际的MCP服务器进行通信。

## 主要组件

### 1. MCPService (engine/service/mcpService.ts)
- 核心MCP连接服务
- 支持多种传输方式：STDIO、SSE、STREAMABLE_HTTP
- 提供工具列表获取、工具调用等功能

### 2. MCPServiceManager
- 管理多个MCP服务实例
- 自动处理连接生命周期
- 防止内存泄漏

### 3. Redux Store (web/src/store/mcpStore.ts)
- 管理MCP连接状态
- 异步操作处理
- 工具启用/禁用状态管理

### 4. useMCP Hook (web/src/hooks/useMCP.ts)
- 便捷的React Hook
- 封装所有MCP相关操作
- 提供类型安全的API

## 使用方法

### 基本使用

```typescript
import { useMCP } from '@/hooks/useMCP';

function MyComponent() {
  const {
    servers,
    activeServer,
    connectedServers,
    availableTools,
    addServer,
    connectServer,
    callTool
  } = useMCP();

  // 添加服务器
  const handleAddServer = () => {
    addServer('Weather Server', 'http://localhost:3001');
  };

  // 连接服务器
  const handleConnect = async (serverId: string, url: string) => {
    try {
      await connectServer(serverId, url);
      console.log('连接成功');
    } catch (error) {
      console.error('连接失败:', error);
    }
  };

  // 调用工具
  const handleCallTool = async () => {
    try {
      const result = await callTool('server-id', 'weather-tool', {
        location: 'Beijing'
      });
      console.log('工具调用结果:', result);
    } catch (error) {
      console.error('工具调用失败:', error);
    }
  };

  return (
    <div>
      {/* 你的UI组件 */}
    </div>
  );
}
```

### 直接使用Redux Actions

```typescript
import { useDispatch } from 'react-redux';
import { connectServer, callTool } from '@/store/mcpStore';

function MyComponent() {
  const dispatch = useDispatch();

  const handleConnect = () => {
    dispatch(connectServer({ 
      serverId: 'my-server', 
      url: 'http://localhost:3001' 
    }));
  };

  const handleCallTool = () => {
    dispatch(callTool({
      serverId: 'my-server',
      toolName: 'weather',
      args: { location: 'Shanghai' }
    }));
  };

  return (
    <div>
      {/* 你的UI组件 */}
    </div>
  );
}
```

### 直接使用MCPService

```typescript
import { mcpServiceManager } from '@/store/mcpStore';
import { MCPService } from '@engine/service/mcpService';

// 创建和使用服务
const service = new MCPService('http://localhost:3001');
await service.connect();

const tools = await service.listTools();
console.log('可用工具:', tools.data);

const result = await service.callTool('weather', { location: 'Tokyo' });
console.log('工具结果:', result.data);

await service.disconnect();
```

## API 参考

### useMCP Hook

#### 状态
- `servers`: 所有服务器列表
- `activeServer`: 当前活跃服务器
- `connectedServers`: 已连接的服务器
- `availableTools`: 所有可用的工具

#### 服务器管理
- `addServer(name, url)`: 添加服务器
- `removeServer(serverId)`: 删除服务器
- `connectServer(serverId, url)`: 连接服务器
- `disconnectServer(serverId)`: 断开服务器
- `setActiveServer(serverId)`: 设置活跃服务器

#### 工具管理
- `toggleToolEnabled(serverId, toolName, enabled)`: 启用/禁用工具
- `callTool(serverId, toolName, args)`: 调用工具
- `getEnabledTools(serverId?)`: 获取启用的工具

### Redux Actions

#### 异步Actions
- `connectServer({ serverId, url })`: 连接服务器
- `disconnectServer(serverId)`: 断开服务器
- `callTool({ serverId, toolName, args })`: 调用工具

#### 同步Actions
- `addServer({ name, url })`: 添加服务器
- `removeServer(serverId)`: 删除服务器
- `setActiveServer(serverId)`: 设置活跃服务器
- `toggleToolEnabled({ serverId, toolName, enabled })`: 切换工具状态
- `clearAllConnections()`: 清理所有连接
- `clearServerError(serverId)`: 清除服务器错误

### Selectors

- `selectMCPServers`: 获取所有服务器
- `selectActiveServer`: 获取活跃服务器
- `selectConnectedServers`: 获取已连接服务器
- `selectAvailableTools`: 获取可用工具

## 连接类型

MCPService支持多种连接方式：

### 1. STDIO (进程通信)
```typescript
const service = new MCPService('', 'STDIO', 'node', ['server.js']);
```

### 2. SSE (Server-Sent Events)
```typescript
const service = new MCPService('http://localhost:3001/sse', 'SSE');
```

### 3. STREAMABLE_HTTP (HTTP流)
```typescript
const service = new MCPService('http://localhost:3001/mcp', 'STREAMABLE_HTTP');
```

### 自动协议推断
如果不指定连接类型，MCPService会根据URL自动推断：
- 包含 `/sse` 的URL → SSE
- 包含 `/streamable` 的URL → STREAMABLE_HTTP
- 其他HTTP URL → STREAMABLE_HTTP
- 空URL → STDIO

## 错误处理

所有异步操作都包含完整的错误处理：

```typescript
const { connectServer } = useMCP();

try {
  await connectServer('server-id', 'http://localhost:3001');
} catch (error) {
  // Redux会自动设置错误状态
  console.error('连接失败:', error);
}
```

错误状态会存储在Redux store中，可以通过选择器获取：

```typescript
const servers = useSelector(selectMCPServers);
const server = servers.find(s => s.id === 'server-id');
if (server?.error) {
  console.log('服务器错误:', server.error);
}
```

## 资源清理

组件卸载时自动清理连接：

```typescript
import { useEffect } from 'react';
import { useMCP } from '@/hooks/useMCP';

function MyComponent() {
  const { clearAllConnections } = useMCP();

  useEffect(() => {
    return () => {
      // 组件卸载时清理所有连接
      clearAllConnections();
    };
  }, [clearAllConnections]);

  return <div>My Component</div>;
}
```

## 示例组件

查看 `web/src/components/MCPExample.tsx` 获取完整的使用示例。

## 注意事项

1. **内存管理**: MCPServiceManager自动管理服务实例，避免内存泄漏
2. **错误恢复**: 连接失败时会自动清理失败的服务实例
3. **状态同步**: Redux状态与实际连接状态保持同步
4. **类型安全**: 所有API都提供完整的TypeScript类型支持
5. **并发安全**: 支持同时连接多个MCP服务器

## 下一步

- 添加连接重试机制
- 实现工具调用历史记录
- 添加性能监控
- 支持工具流式调用
