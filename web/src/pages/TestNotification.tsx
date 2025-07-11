// web/src/pages/TestNotification.tsx
// 测试消息提示服务的页面
import React from 'react';
import { Button, Space, Card } from 'antd';
import { mcpNotificationService } from '@/services/mcpNotificationService';

const TestNotification: React.FC = () => {
  const testServerConnected = () => {
    mcpNotificationService.showServerConnected('Test Server', 5);
  };

  const testServerConnectionFailed = () => {
    mcpNotificationService.showServerConnectionFailed('Test Server', '连接超时');
  };

  const testReconnectCompleted = () => {
    mcpNotificationService.showReconnectCompleted({
      successCount: 2,
      failureCount: 1,
      totalCount: 3
    });
  };

  const testReconnectAllSuccess = () => {
    mcpNotificationService.showReconnectCompleted({
      successCount: 3,
      failureCount: 0,
      totalCount: 3
    });
  };

  const testReconnectAllFailed = () => {
    mcpNotificationService.showReconnectCompleted({
      successCount: 0,
      failureCount: 3,
      totalCount: 3
    });
  };

  const testReconnectStarted = () => {
    const hideLoading = mcpNotificationService.showReconnectStarted(3);
    setTimeout(() => {
      hideLoading();
      testReconnectCompleted();
    }, 2000);
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card title="MCP 消息提示服务测试">
        <Space direction="vertical" size="middle">
          <Space wrap>
            <Button onClick={testServerConnected}>测试服务器连接成功</Button>
            <Button onClick={testServerConnectionFailed}>测试服务器连接失败</Button>
          </Space>
          
          <Space wrap>
            <Button onClick={testReconnectAllSuccess}>测试重连全部成功</Button>
            <Button onClick={testReconnectCompleted}>测试重连部分成功</Button>
            <Button onClick={testReconnectAllFailed}>测试重连全部失败</Button>
          </Space>
          
          <Space wrap>
            <Button onClick={testReconnectStarted}>测试重连流程（含加载提示）</Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export default TestNotification;
