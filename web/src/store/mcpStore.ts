import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Tool } from '@engine/service/mcpService';
import { MCPService } from '@engine/service/mcpService';
import { mcpNotificationService } from '@/services/mcpNotificationService';

// MCP服务实例管理器
class MCPServiceManager {
  private services = new Map<string, MCPService>();

  getService(serverId: string): MCPService | undefined {
    return this.services.get(serverId);
  }

  createService(serverId: string, url: string): MCPService {
    // 如果已存在，先清理
    const existing = this.services.get(serverId);
    if (existing) {
      existing.disconnect().catch(console.error);
    }

    // 创建新的服务实例
    const service = new MCPService(url);
    this.services.set(serverId, service);
    return service;
  }

  async removeService(serverId: string): Promise<void> {
    const service = this.services.get(serverId);
    if (service) {
      try {
        console.log(`[MCPServiceManager] 断开服务 ${serverId}`);
        await service.disconnect();
        console.log(`[MCPServiceManager] 服务 ${serverId} 断开成功`);
      } catch (error) {
        console.error(`[MCPServiceManager] 断开服务 ${serverId} 时出错:`, error);
        // 即使断开失败，也要从管理器中移除
      } finally {
        this.services.delete(serverId);
        console.log(`[MCPServiceManager] 服务 ${serverId} 已从管理器中移除`);
      }
    }
  }

  async removeAllServices(): Promise<void> {
    console.log('[MCPServiceManager] 开始清理所有服务...');
    const promises = Array.from(this.services.entries()).map(async ([serverId, service]) => {
      try {
        console.log(`[MCPServiceManager] 断开服务 ${serverId}`);
        await service.disconnect();
        console.log(`[MCPServiceManager] 服务 ${serverId} 断开成功`);
      } catch (error) {
        console.error(`[MCPServiceManager] 断开服务 ${serverId} 时出错:`, error);
      }
    });
    await Promise.all(promises);
    this.services.clear();
    console.log('[MCPServiceManager] 所有服务已清理完成');
  }
}

// 全局服务管理器实例
const mcpServiceManager = new MCPServiceManager();

// 异步 thunk actions
export const connectServer = createAsyncThunk(
  'mcp/connectServer',
  async ({ serverId, url }: { serverId: string; url: string }, { rejectWithValue, getState }) => {
    try {
      console.log(`[MCPStore] 开始连接服务器 ${serverId}, URL: ${url}`);
      
      // 获取服务器名称
      const state = getState() as { mcp: MCPState };
      const server = state.mcp.servers.find(s => s.id === serverId);
      const serverName = server?.name || serverId;
      
      // 创建并连接MCP服务
      const mcpService = mcpServiceManager.createService(serverId, url);
      await mcpService.connect();
      
      // 获取工具列表
      console.log(`[MCPStore] 获取服务器 ${serverId} 的工具列表`);
      const toolsResult = await mcpService.listTools();
      
      if (toolsResult.error) {
        throw new Error(toolsResult.error);
      }
      
      // 转换为MCPTool格式，添加enabled字段
      const tools: MCPTool[] = toolsResult.data.map(tool => ({
        ...tool,
        enabled: true // 默认启用所有工具
      }));
      
      console.log(`[MCPStore] 服务器 ${serverId} 连接成功，获取到 ${tools.length} 个工具`);
      
      // 显示连接成功消息
      mcpNotificationService.showServerConnected(serverName, tools.length);
      
      return { serverId, tools };
    } catch (error) {
      console.error(`[MCPStore] 服务器 ${serverId} 连接失败:`, error);
      
      // 获取服务器名称用于错误消息
      const state = getState() as { mcp: MCPState };
      const server = state.mcp.servers.find(s => s.id === serverId);
      const serverName = server?.name || serverId;
      
      // 显示连接失败消息
      mcpNotificationService.showServerConnectionFailed(
        serverName, 
        error instanceof Error ? error.message : '连接失败'
      );
      
      // 清理失败的服务实例
      await mcpServiceManager.removeService(serverId);
      return rejectWithValue(error instanceof Error ? error.message : '连接失败');
    }
  }
);

export const disconnectServer = createAsyncThunk(
  'mcp/disconnectServer',
  async (serverId: string, { rejectWithValue, getState }) => {
    try {
      console.log(`[MCPStore] 开始断开服务器 ${serverId}`);
      
      // 获取服务器名称
      const state = getState() as { mcp: MCPState };
      const server = state.mcp.servers.find(s => s.id === serverId);
      const serverName = server?.name || serverId;
      
      // 断开并移除服务实例
      await mcpServiceManager.removeService(serverId);
      
      console.log(`[MCPStore] 服务器 ${serverId} 断开成功`);
      
      // 显示断开连接消息
      mcpNotificationService.showServerDisconnected(serverName);
      
      return serverId;
    } catch (error) {
      console.error(`[MCPStore] 服务器 ${serverId} 断开失败:`, error);
      
      // 获取服务器名称用于错误消息
      const state = getState() as { mcp: MCPState };
      const server = state.mcp.servers.find(s => s.id === serverId);
      const serverName = server?.name || serverId;
      
      // 显示断开连接失败消息
      mcpNotificationService.showServerDisconnectionFailed(
        serverName, 
        error instanceof Error ? error.message : '断开连接失败'
      );
      
      return rejectWithValue(error instanceof Error ? error.message : '断开连接失败');
    }
  }
);

// 自动重连之前连接的服务器
export const reconnectServers = createAsyncThunk(
  'mcp/reconnectServers',
  async (_, { getState, dispatch }) => {
    const state = getState() as { mcp: MCPState };
    const { servers } = state.mcp;
    
    // 找到所有之前连接的服务器（isConnected为true的）
    const serversToReconnect = servers.filter(server => server.isConnected);
    
    if (serversToReconnect.length === 0) {
      console.log('[MCPStore] 没有需要重连的服务器');
      mcpNotificationService.showReconnectCompleted({
        successCount: 0,
        failureCount: 0,
        totalCount: 0
      });
      return { successCount: 0, failureCount: 0, totalCount: 0 };
    }
    
    console.log(`[MCPStore] 开始自动重连 ${serversToReconnect.length} 个服务器:`, serversToReconnect.map(s => s.name));
    
    // 显示重连开始消息
    const hideLoading = mcpNotificationService.showReconnectStarted(serversToReconnect.length);
    
    // 首先清理所有连接状态，避免状态不一致
    await mcpServiceManager.removeAllServices();
    
    // 并发重连所有服务器
    const reconnectPromises = serversToReconnect.map(server => 
      dispatch(connectServer({ serverId: server.id, url: server.url }))
    );
    
    try {
      const results = await Promise.allSettled(reconnectPromises);
      
      // 关闭加载提示
      hideLoading();
      
      // 简化统计：检查最终连接状态
      const finalState = getState() as { mcp: MCPState };
      const finalServers = finalState.mcp.servers;
      
      let successCount = 0;
      let failureCount = 0;
      
      for (const originalServer of serversToReconnect) {
        const finalServer = finalServers.find(s => s.id === originalServer.id);
        if (finalServer && finalServer.isConnected) {
          successCount++;
        } else {
          failureCount++;
        }
      }
      
      console.log(`[MCPStore] 自动重连完成: ${successCount} 个成功, ${failureCount} 个失败`);
      console.log(`[MCPStore] 重连结果详情:`, results);
      
      // 显示重连完成消息
      const reconnectResult = { successCount, failureCount, totalCount: serversToReconnect.length };
      console.log(`[MCPStore] 调用 showReconnectCompleted:`, reconnectResult);
      mcpNotificationService.showReconnectCompleted(reconnectResult);
      
      return reconnectResult;
    } catch (error) {
      console.error('[MCPStore] 自动重连过程中出错:', error);
      hideLoading();
      mcpNotificationService.showError('自动重连过程中发生错误');
      throw error;
    }
  }
);

// 工具调用异步thunk
export const callTool = createAsyncThunk(
  'mcp/callTool',
  async ({ serverId, toolName, args }: { serverId: string; toolName: string; args: Record<string, any> }, { rejectWithValue, getState }) => {
    try {
      console.log(`[MCPStore] 调用工具 ${toolName} on server ${serverId}, 参数:`, args);
      
      // 获取服务器名称
      const state = getState() as { mcp: MCPState };
      const server = state.mcp.servers.find(s => s.id === serverId);
      const serverName = server?.name || serverId;
      
      const mcpService = mcpServiceManager.getService(serverId);
      if (!mcpService) {
        throw new Error(`服务器 ${serverId} 未连接`);
      }
      
      const result = await mcpService.callTool(toolName, args);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      console.log(`[MCPStore] 工具 ${toolName} 调用成功:`, result.data);
      
      // 显示工具调用成功消息
      mcpNotificationService.showToolCallSuccess(toolName, serverName);
      
      return { serverId, toolName, args, result: result.data };
    } catch (error) {
      console.error(`[MCPStore] 工具 ${toolName} 调用失败:`, error);
      
      // 获取服务器名称用于错误消息
      const state = getState() as { mcp: MCPState };
      const server = state.mcp.servers.find(s => s.id === serverId);
      const serverName = server?.name || serverId;
      
      // 显示工具调用失败消息
      mcpNotificationService.showToolCallFailed(
        toolName, 
        serverName, 
        error instanceof Error ? error.message : '工具调用失败'
      );
      
      return rejectWithValue(error instanceof Error ? error.message : '工具调用失败');
    }
  }
);

// 选择器
export const selectMCPServers = (state: { mcp: MCPState }) => state.mcp.servers;
export const selectActiveServer = (state: { mcp: MCPState }) => {
  const { servers, activeServerId } = state.mcp;
  return activeServerId ? servers.find(s => s.id === activeServerId) : undefined;
};
export const selectConnectedServers = (state: { mcp: MCPState }) => 
  state.mcp.servers.filter(s => s.isConnected);
export const selectAvailableTools = (state: { mcp: MCPState }) => {
  const connectedServers = selectConnectedServers(state);
  return connectedServers.flatMap(server => 
    server.tools.filter(tool => tool.enabled).map(tool => ({
      ...tool,
      serverId: server.id,
      serverName: server.name
    }))
  );
};

// 导出服务管理器，供其他组件使用
export { mcpServiceManager };

// 扩展的工具接口，包含启用状态
export interface MCPTool extends Tool {
  enabled: boolean;
}

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  isConnected: boolean;
  loading: boolean;
  tools: MCPTool[];
  error?: string;
}

interface MCPState {
  servers: MCPServer[];
  activeServerId?: string;
  isLoading: boolean;
}

const initialState: MCPState = {
  servers: [],
  activeServerId: undefined,
  isLoading: false,
};

const mcpSlice = createSlice({
  name: 'mcp',
  initialState,
  reducers: {
    addServer(state, action: PayloadAction<{ name: string; url: string }>) {
      state.servers.push({
        id: `${Date.now()}-${Math.random()}`,
        name: action.payload.name,
        url: action.payload.url,
        isConnected: false,
        loading: false,
        tools: [],
      });
    },
    removeServer(state, action: PayloadAction<string>) {
      state.servers = state.servers.filter(s => s.id !== action.payload);
      if (state.activeServerId === action.payload) {
        state.activeServerId = undefined;
      }
      // 异步清理MCP服务实例
      mcpServiceManager.removeService(action.payload).catch(console.error);
    },
    setActiveServer(state, action: PayloadAction<string | undefined>) {
      state.activeServerId = action.payload;
    },
    setIsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    // 保留这个，用于手动更新服务器状态
    updateServer(state, action: PayloadAction<{ id: string; data: Partial<MCPServer> }>) {
      const { id, data } = action.payload;
      state.servers = state.servers.map(server =>
        server.id === id ? { ...server, ...data } : server
      );
    },
    toggleToolEnabled: (state, action: PayloadAction<{ serverId: string; toolName: string; enabled: boolean }>) => {
      state.servers = state.servers.map(server => {
        if (server.id !== action.payload.serverId) return server;
        const tools = server.tools.map(tool =>
          tool.name === action.payload.toolName ? { ...tool, enabled: action.payload.enabled } : tool
        );
        return { ...server, tools };
      });
    },
    // 清理所有连接
    clearAllConnections(state) {
      state.servers = state.servers.map(server => ({
        ...server,
        isConnected: false,
        loading: false,
        tools: [],
        error: undefined
      }));
      state.activeServerId = undefined;
      // 异步清理所有MCP服务实例
      mcpServiceManager.removeAllServices().catch(console.error);
    },
    // 清除服务器错误状态
    clearServerError(state, action: PayloadAction<string>) {
      const server = state.servers.find(s => s.id === action.payload);
      if (server) {
        server.error = undefined;
      }
    },
  },
  // extraReducers 处理复杂的异步操作
  extraReducers: builder => {
    builder
      .addCase(connectServer.pending, (state, action) => {
        const server = state.servers.find(s => s.id === action.meta.arg.serverId);
        if (server) {
          server.loading = true;
        }
      })
      .addCase(connectServer.fulfilled, (state, action) => {
        const { serverId, tools } = action.payload;
        const server = state.servers.find(s => s.id === serverId);
        if (server) {
          server.isConnected = true;
          server.loading = false;
          server.tools = tools;
          server.error = undefined; // 清除错误状态
        }
      })
      .addCase(connectServer.rejected, (state, action) => {
        const server = state.servers.find(s => s.id === action.meta.arg.serverId);
        if (server) {
          server.loading = false;
          server.isConnected = false;
          server.error = action.payload as string;
        }
      })
      .addCase(disconnectServer.pending, (state, action) => {
        const server = state.servers.find(s => s.id === action.meta.arg);
        if (server) {
          server.loading = true;
        }
      })
      .addCase(disconnectServer.fulfilled, (state, action) => {
        const server = state.servers.find(s => s.id === action.payload);
        if (server) {
          server.isConnected = false;
          server.loading = false;
          server.tools = [];
          server.error = undefined; // 清除错误状态
        }
      })
      .addCase(disconnectServer.rejected, (state, action) => {
        const server = state.servers.find(s => s.id === action.meta.arg);
        if (server) {
          server.loading = false;
          server.error = action.payload as string;
        }
      });
  },
});

export const { addServer, removeServer, setActiveServer, setIsLoading, updateServer, toggleToolEnabled, clearAllConnections, clearServerError } = mcpSlice.actions;
export default mcpSlice.reducer;