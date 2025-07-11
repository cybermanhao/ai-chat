// web/src/test/mcpReconnectTest.ts
// 测试 MCP 服务器重连功能
import { store } from '@/store';
import { reconnectServers } from '@/store/mcpStore';
import { mcpNotificationService } from '@/services/mcpNotificationService';

/**
 * 手动测试 MCP 服务器重连功能
 */
export const testMCPReconnect = async () => {
  console.log('[MCPReconnectTest] 开始测试 MCP 服务器重连...');
  
  // 获取当前状态
  const state = store.getState();
  const servers = state.mcp.servers;
  
  console.log('[MCPReconnectTest] 当前服务器状态:', servers);
  
  const connectedServers = servers.filter(s => s.isConnected);
  console.log('[MCPReconnectTest] 已连接的服务器:', connectedServers);
  
  if (connectedServers.length === 0) {
    console.log('[MCPReconnectTest] 没有已连接的服务器，无法测试重连');
    mcpNotificationService.showInfo('没有已连接的服务器，无法测试重连');
    return;
  }
  
  try {
    // 调用重连
    const result = await store.dispatch(reconnectServers()).unwrap();
    console.log('[MCPReconnectTest] 重连结果:', result);
  } catch (error) {
    console.error('[MCPReconnectTest] 重连失败:', error);
  }
};

/**
 * 测试消息提示服务
 */
export const testReconnectMessage = () => {
  console.log('[MCPReconnectTest] 测试重连消息提示...');
  
  // 测试各种重连结果
  setTimeout(() => {
    mcpNotificationService.showReconnectCompleted({
      successCount: 3,
      failureCount: 0,
      totalCount: 3
    });
  }, 1000);
  
  setTimeout(() => {
    mcpNotificationService.showReconnectCompleted({
      successCount: 2,
      failureCount: 1,
      totalCount: 3
    });
  }, 2000);
  
  setTimeout(() => {
    mcpNotificationService.showReconnectCompleted({
      successCount: 0,
      failureCount: 3,
      totalCount: 3
    });
  }, 3000);
};

// 将测试函数挂载到全局对象上，方便在控制台调用
if (typeof window !== 'undefined') {
  (window as any).testMCPReconnect = testMCPReconnect;
  (window as any).testReconnectMessage = testReconnectMessage;
  
  console.log('[MCPReconnectTest] 测试函数已挂载到全局对象:');
  console.log('- window.testMCPReconnect() - 测试实际重连功能');
  console.log('- window.testReconnectMessage() - 测试重连消息提示');
}
