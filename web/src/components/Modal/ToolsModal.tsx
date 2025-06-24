import React from 'react';
import { Modal, List, Spin, Alert } from 'antd';
import { useMCPStore } from '@/store/mcpStore';

const ToolsModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  // 只展示当前已连接服务器的工具
  const { servers, activeServerId, isLoading } = useMCPStore();
  const activeServer = servers.find(s => s.id === activeServerId && s.isConnected);
  const tools = activeServer?.tools || [];
  const error = activeServer?.error;

  React.useEffect(() => {
    // 连接服务器时会自动拉取工具列表，这里无需重复 fetch
  }, [open, activeServerId]);

  return (
    <Modal
      title="MCP 工具管理"
      open={open}
      onCancel={onClose}
      footer={null}
    >
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 12 }} />}
      <Spin spinning={isLoading} tip="加载工具列表...">
        <List
          itemLayout="horizontal"
          dataSource={tools}
          renderItem={(tool) => (
            <List.Item>
              <List.Item.Meta
                title={tool.name}
                description={tool.description}
              />
            </List.Item>
          )}
        />
      </Spin>
    </Modal>
  );
};

export default ToolsModal;
