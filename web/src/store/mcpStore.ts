import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Tool } from '@engine/service/mcpClient';
import { MCPClient } from '@engine/service/mcpClient';
import { mcpNotificationService } from '@/services/mcpNotificationService';
import { messageBridge } from '@engine/service/messageBridgeInstance';
import { llmService } from '@engine/service/llmService';

// MCP服务实例管理器
class MCPClientManager {
  private services = new Map<string, MCPClient>();

  getService(serverId: string): MCPClient | undefined {
    return this.services.get(serverId);
  }

  getFirstAvailableService(): MCPClient | undefined {
    return this.services.values().next().value;
  }

  getFirstAvailableServerId(): string | undefined {
    return this.services.keys().next().value;
  }

  createService(serverId: string, url: string): MCPClient {
    // 如果已存在，先清理
    const existing = this.services.get(serverId);
    if (existing) {
      existing.disconnect().catch(console.error);
    }

    // 创建新的服务实例
    const service = new MCPClient(url);
    this.services.set(serverId, service);
    return service;
  }

  async removeService(serverId: string): Promise<void> {
    const service = this.services.get(serverId);
    if (service) {
      try {
        console.log(`[MCPClientManager] 断开服务 ${serverId}`);
        await service.disconnect();
        console.log(`[MCPClientManager] 服务 ${serverId} 断开成功`);
      } catch (error) {
        console.error(`[MCPClientManager] 断开服务 ${serverId} 时出错:`, error);
        // 即使断开失败，也要从管理器中移除
      } finally {
        this.services.delete(serverId);
        console.log(`[MCPClientManager] 服务 ${serverId} 已从管理器中移除`);
      }
    }
  }

  async removeAllServices(): Promise<void> {
    console.log('[MCPClientManager] 开始清理所有服务...');
    const promises = Array.from(this.services.entries()).map(async ([serverId, service]) => {
      try {
        console.log(`[MCPClientManager] 断开服务 ${serverId}`);
        await service.disconnect();
        console.log(`[MCPClientManager] 服务 ${serverId} 断开成功`);
      } catch (error) {
        console.error(`[MCPClientManager] 断开服务 ${serverId} 时出错:`, error);
      }
    });
    await Promise.all(promises);
    this.services.clear();
    console.log('[MCPClientManager] 所有服务已清理完成');
  }
}

// 全局服务管理器实例
const mcpClientManager = new MCPClientManager();

// 启动时注入真实依赖和环境
messageBridge['mcpClient'] = mcpClientManager;
messageBridge['llmService'] = llmService;
messageBridge['env'] = 'web';

// 异步 thunk actions
export const connectServer = createAsyncThunk(
  'mcp/connectServer',
  async ({ serverId, url }: { serverId: string; url: string }, { rejectWithValue }) => {
    return new Promise<{ serverId: string; tools: any[] }>((resolve, reject) => {
      messageBridge.connectMCP(serverId, url);
      const onDone = (payload: any) => {
        if (payload.serverId === serverId) {
          messageBridge.off('done', onDone);
          resolve({ serverId, tools: payload.tools });
        }
      };
      const onError = (payload: any) => {
        if (payload.serverId === serverId) {
          messageBridge.off('error', onError);
          reject(rejectWithValue(payload.error));
        }
      };
      messageBridge.on('done', onDone);
      messageBridge.on('error', onError);
    });
  }
);

export const disconnectServer = createAsyncThunk(
  'mcp/disconnectServer',
  async (serverId: string, { rejectWithValue }) => {
    return new Promise<string>((resolve, reject) => {
      messageBridge.disconnectMCP(serverId);
      const onDone = (payload: any) => {
        if (payload.serverId === serverId) {
          messageBridge.off('done', onDone);
          resolve(serverId);
        }
      };
      const onError = (payload: any) => {
        if (payload.serverId === serverId) {
          messageBridge.off('error', onError);
          reject(rejectWithValue(payload.error));
        }
      };
      messageBridge.on('done', onDone);
      messageBridge.on('error', onError);
    });
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
    await mcpClientManager.removeAllServices();
    
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
    return new Promise<{ serverId: string; toolName: string; args: Record<string, any>; result: any }>((resolve, reject) => {
      console.log(`[MCPStore] 调用工具 ${toolName} on server ${serverId}, 参数:`, args);
      
      // 获取服务器名称
      const state = getState() as { mcp: MCPState };
      const server = state.mcp.servers.find(s => s.id === serverId);
      const serverName = server?.name || serverId;
      
      // 使用MessageBridge统一接口
      messageBridge.send('message/mcp/call-tool', { serverId, toolName, args });
      
      const onToolResult = (payload: any) => {
        if (payload.serverId === serverId && payload.toolName === toolName) {
          messageBridge.off('toolresult', onToolResult);
          messageBridge.off('error', onError);
          
          console.log(`[MCPStore] 工具 ${toolName} 调用成功:`, payload.result);
          
          // 显示工具调用成功消息
          mcpNotificationService.showToolCallSuccess(toolName, serverName);
          
          resolve({ serverId, toolName, args, result: payload.result });
        }
      };
      
      const onError = (payload: any) => {
        if (payload.serverId === serverId && payload.toolName === toolName) {
          messageBridge.off('toolresult', onToolResult);
          messageBridge.off('error', onError);
          
          console.error(`[MCPStore] 工具 ${toolName} 调用失败:`, payload.error);
          
          // 显示工具调用失败消息
          mcpNotificationService.showToolCallFailed(
            toolName, 
            serverName, 
            payload.error || '工具调用失败'
          );
          
          reject(rejectWithValue(payload.error || '工具调用失败'));
        }
      };
      
      messageBridge.on('toolresult', onToolResult);
      messageBridge.on('error', onError);
    });
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
export { mcpClientManager };

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
      mcpClientManager.removeService(action.payload).catch(console.error);
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
      mcpClientManager.removeAllServices().catch(console.error);
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
        const payload = action.payload as any;
        if (payload && typeof payload === 'object' && 'serverId' in payload && 'tools' in payload) {
          const { serverId, tools } = payload;
        const server = state.servers.find(s => s.id === serverId);
        if (server) {
          server.isConnected = true;
          server.loading = false;
          server.tools = Array.isArray(tools) ? tools : [];
          server.error = undefined;
        }
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
        const payload = action.payload as any;
        if (typeof payload === 'string') {
          const server = state.servers.find(s => s.id === payload);
        if (server) {
          server.isConnected = false;
          server.loading = false;
          server.tools = [];
            server.error = undefined;
          }
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