// web/src/test/mcpNotificationTest.ts
// 测试 MCP 消息提示服务
import { mcpNotificationService } from '@/services/mcpNotificationService';

/**
 * 测试 MCP 消息提示服务的各种功能
 */
export const testMCPNotificationService = () => {
  console.log('[MCPNotificationTest] 开始测试 MCP 消息提示服务...');

  // 测试连接成功消息
  setTimeout(() => {
    console.log('[MCPNotificationTest] 测试连接成功消息');
    mcpNotificationService.showServerConnected('测试服务器', 5);
  }, 1000);

  // 测试连接失败消息
  setTimeout(() => {
    console.log('[MCPNotificationTest] 测试连接失败消息');
    mcpNotificationService.showServerConnectionFailed('测试服务器', '连接超时');
  }, 2000);

  // 测试重连完成消息
  setTimeout(() => {
    console.log('[MCPNotificationTest] 测试重连完成消息');
    mcpNotificationService.showReconnectCompleted({
      successCount: 2,
      failureCount: 1,
      totalCount: 3
    });
  }, 3000);

  // 测试工具调用成功消息
  setTimeout(() => {
    console.log('[MCPNotificationTest] 测试工具调用成功消息');
    mcpNotificationService.showToolCallSuccess('test-tool', '测试服务器');
  }, 4000);

  // 测试工具调用失败消息
  setTimeout(() => {
    console.log('[MCPNotificationTest] 测试工具调用失败消息');
    mcpNotificationService.showToolCallFailed('test-tool', '测试服务器', '工具执行错误');
  }, 5000);

  console.log('[MCPNotificationTest] 测试计划已安排完成');
};

// 在开发环境中自动运行测试
if (process.env.NODE_ENV === 'development') {
  // 延迟运行测试，确保 UI 已经加载
  setTimeout(() => {
    console.log('[MCPNotificationTest] 开发环境检测到，自动运行测试');
    // 取消自动测试，避免干扰用户
    // testMCPNotificationService();
  }, 2000);
}
