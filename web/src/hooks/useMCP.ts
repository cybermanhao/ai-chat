// web/src/hooks/useMCP.ts
import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import type { AppDispatch, RootState } from '../store';
import {
  connectServer,
  disconnectServer,
  callTool,
  addServer,
  removeServer,
  setActiveServer,
  toggleToolEnabled,
  clearServerError,
  selectMCPServers,
  selectActiveServer,
  selectConnectedServers,
  selectAvailableTools,
  mcpClientManager,
  type MCPTool
} from '../store/mcpStore';

export interface UseMCPReturn {
  // 状态
  servers: ReturnType<typeof selectMCPServers>;
  activeServer: ReturnType<typeof selectActiveServer>;
  connectedServers: ReturnType<typeof selectConnectedServers>;
  availableTools: ReturnType<typeof selectAvailableTools>;
  isLoading: boolean;

  // 服务器管理
  addServer: (name: string, url: string) => void;
  removeServer: (serverId: string) => void;
  connectServer: (serverId: string, url: string) => Promise<any>;
  disconnectServer: (serverId: string) => Promise<any>;
  setActiveServer: (serverId?: string) => void;
  clearServerError: (serverId: string) => void;

  // 工具管理
  toggleToolEnabled: (serverId: string, toolName: string, enabled: boolean) => void;
  callTool: (serverId: string, toolName: string, args: Record<string, any>) => Promise<any>;
  getEnabledTools: (serverId?: string) => MCPTool[];

  // 直接访问服务
  getMCPClient: (serverId: string) => ReturnType<typeof mcpClientManager.getService>;
}

/**
 * Hook for managing MCP connections and tools
 */
export function useMCP(): UseMCPReturn {
  const dispatch = useDispatch<AppDispatch>();
  
  // 选择器
  const servers = useSelector((state: RootState) => selectMCPServers(state));
  const activeServer = useSelector((state: RootState) => selectActiveServer(state));
  const connectedServers = useSelector((state: RootState) => selectConnectedServers(state));
  const availableTools = useSelector((state: RootState) => selectAvailableTools(state));
  const isLoading = useSelector((state: RootState) => state.mcp.isLoading);

  // 服务器管理
  const handleAddServer = useCallback((name: string, url: string) => {
    dispatch(addServer({ name, url }));
  }, [dispatch]);

  const handleRemoveServer = useCallback((serverId: string) => {
    dispatch(removeServer(serverId));
  }, [dispatch]);

  const handleConnectServer = useCallback((serverId: string, url: string) => {
    return dispatch(connectServer({ serverId, url }));
  }, [dispatch]);

  const handleDisconnectServer = useCallback((serverId: string) => {
    return dispatch(disconnectServer(serverId));
  }, [dispatch]);

  const handleSetActiveServer = useCallback((serverId?: string) => {
    dispatch(setActiveServer(serverId));
  }, [dispatch]);

  const handleClearServerError = useCallback((serverId: string) => {
    dispatch(clearServerError(serverId));
  }, [dispatch]);

  // 工具管理
  const handleToggleToolEnabled = useCallback((serverId: string, toolName: string, enabled: boolean) => {
    dispatch(toggleToolEnabled({ serverId, toolName, enabled }));
  }, [dispatch]);

  const handleCallTool = useCallback((serverId: string, toolName: string, args: Record<string, any>) => {
    return dispatch(callTool({ serverId, toolName, args }));
  }, [dispatch]);

  const getEnabledTools = useCallback((serverId?: string): MCPTool[] => {
    if (serverId) {
      const server = servers.find(s => s.id === serverId);
      return server ? server.tools.filter(tool => tool.enabled) : [];
    }
    return availableTools;
  }, [servers, availableTools]);

  // 直接访问服务
  const getMCPClient = useCallback((serverId: string) => {
    return mcpClientManager.getService(serverId);
  }, []);

  return {
    // 状态
    servers,
    activeServer,
    connectedServers,
    availableTools,
    isLoading,

    // 服务器管理
    addServer: handleAddServer,
    removeServer: handleRemoveServer,
    connectServer: handleConnectServer,
    disconnectServer: handleDisconnectServer,
    setActiveServer: handleSetActiveServer,
    clearServerError: handleClearServerError,

    // 工具管理
    toggleToolEnabled: handleToggleToolEnabled,
    callTool: handleCallTool,
    getEnabledTools,

    // 直接访问服务
    getMCPClient,
  };
}
