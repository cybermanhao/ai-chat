// web/src/services/mcpNotificationService.example.ts
// MCP 消息提示服务使用示例

import { mcpNotificationService } from './mcpNotificationService';

// 示例：连接服务器
export const connectServerExample = async (serverId: string, serverName: string, url: string) => {
  try {
    // 模拟连接过程
    console.log(`正在连接服务器 ${serverName}...`);
    
    // 假设连接成功，获取到5个工具
    const toolCount = 5;
    mcpNotificationService.showServerConnected(serverName, toolCount);
    
  } catch (error) {
    // 连接失败
    mcpNotificationService.showServerConnectionFailed(
      serverName, 
      error instanceof Error ? error.message : '连接超时'
    );
  }
};

// 示例：断开服务器连接
export const disconnectServerExample = async (serverId: string, serverName: string) => {
  try {
    // 模拟断开连接过程
    console.log(`正在断开服务器 ${serverName}...`);
    
    mcpNotificationService.showServerDisconnected(serverName);
    
  } catch (error) {
    // 断开失败
    mcpNotificationService.showServerDisconnectionFailed(
      serverName, 
      error instanceof Error ? error.message : '断开连接失败'
    );
  }
};

// 示例：自动重连
export const autoReconnectExample = async () => {
  const serversToReconnect = [
    { id: '1', name: 'Server 1', url: 'http://localhost:3000' },
    { id: '2', name: 'Server 2', url: 'http://localhost:3001' },
    { id: '3', name: 'Server 3', url: 'http://localhost:3002' }
  ];
  
  // 显示重连开始消息
  const hideLoading = mcpNotificationService.showReconnectStarted(serversToReconnect.length);
  
  try {
    // 模拟重连过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 关闭加载提示
    hideLoading();
    
    // 模拟重连结果：2个成功，1个失败
    mcpNotificationService.showReconnectCompleted({
      successCount: 2,
      failureCount: 1,
      totalCount: 3
    });
    
  } catch (error) {
    hideLoading();
    mcpNotificationService.showError('自动重连过程中发生错误');
  }
};

// 示例：工具调用
export const callToolExample = async (toolName: string, serverName: string, args: any) => {
  try {
    // 模拟工具调用
    console.log(`正在调用工具 ${toolName}...`);
    
    mcpNotificationService.showToolCallSuccess(toolName, serverName);
    
  } catch (error) {
    mcpNotificationService.showToolCallFailed(
      toolName, 
      serverName, 
      error instanceof Error ? error.message : '工具调用失败'
    );
  }
};

// 示例：自定义配置
export const customConfigExample = () => {
  // 更新配置，只显示错误消息，不显示成功消息
  mcpNotificationService.updateConfig({
    showSuccess: false,
    showError: true,
    showWarning: true,
    showInfo: false,
    duration: 5 // 显示5秒
  });
};
