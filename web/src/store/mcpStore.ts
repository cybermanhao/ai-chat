import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Tool } from '@engine/service/mcpService';

// 异步 thunk actions
export const connectServer = createAsyncThunk(
  'mcp/connectServer',
  async ({ serverId, url }: { serverId: string; url: string }, { rejectWithValue }) => {
    try {
      // TODO: 替换为实际的 MCP 连接逻辑
      // const mcpService = new MCPService();
      // const tools = await mcpService.connect(url);
      
      // 模拟连接延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟成功连接和获取工具列表
      const mockTools: MCPTool[] = [
        { name: 'test', title: '测试工具', description: '测试工具', type: 'function', enabled: true },
        { name: 'weather', title: '天气查询', description: '天气查询', type: 'function', enabled: true },
      ];
      
      return { serverId, tools: mockTools };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '连接失败');
    }
  }
);

export const disconnectServer = createAsyncThunk(
  'mcp/disconnectServer',
  async (serverId: string, { rejectWithValue }) => {
    try {
      // TODO: 替换为实际的 MCP 断开逻辑
      // const mcpService = new MCPService();
      // await mcpService.disconnect(serverId);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      return serverId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '断开连接失败');
    }
  }
);

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
        }
      })
      .addCase(connectServer.rejected, (state, action) => {
        const server = state.servers.find(s => s.id === action.meta.arg.serverId);
        if (server) {
          server.loading = false;
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

export const { addServer, removeServer, setActiveServer, setIsLoading, updateServer, toggleToolEnabled } = mcpSlice.actions;
export default mcpSlice.reducer;