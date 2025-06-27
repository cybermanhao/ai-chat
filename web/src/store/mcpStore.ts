import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Tool } from '@engine/service/mcpService';

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  isConnected: boolean;
  loading: boolean;
  tools: Tool[];
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
});

export const { addServer, removeServer, setActiveServer, setIsLoading, updateServer, toggleToolEnabled } = mcpSlice.actions;
export default mcpSlice.reducer;