import { mcpStoreDefinition } from '@engine/store/mcpStore';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MCPState, MCPServer } from '@engine/store/mcpStore';

export const useMCPStore = create<MCPState & {
  connectServer: (id: string) => Promise<void>;
  disconnectServer: (id: string) => void;
}>(
  persist(
    (set, get) => ({
      ...mcpStoreDefinition(set, get),
      connectServer: async (id: string) => {
        set((state: MCPState) => ({
          servers: state.servers.map((s: MCPServer) =>
            s.id === id ? { ...s, isConnected: true, error: undefined } : s
          ),
        }));
      },
      disconnectServer: (id: string) => {
        set((state: MCPState) => ({
          servers: state.servers.map((s: MCPServer) =>
            s.id === id ? { ...s, isConnected: false } : s
          ),
        }));
      },
    }),
    {
      name: 'mcp_store',
      partialize: (state: MCPState) => ({
        servers: state.servers,
        activeServerId: state.activeServerId,
        currentModel: state.currentModel,
      })
    }
  )
);