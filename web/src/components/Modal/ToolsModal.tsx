import React from 'react';
import { Modal, List, Switch } from 'antd';

interface Tool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface ToolsModalProps {
  open: boolean;
  loading?: boolean;
  enabledTools: string[];
  onClose: () => void;
  onToggle: (toolId: string, enabled: boolean) => void;
}

const defaultTools: Tool[] = [
  {
    id: 'web-search',
    name: '网页搜索',
    description: '允许 AI 搜索互联网获取信息',
    enabled: true,
  },
  {
    id: 'code-execution',
    name: '代码执行',
    description: '允许 AI 执行代码来解决问题',
    enabled: false,
  },
  // Add more tools as needed
];

const ToolsModal: React.FC<ToolsModalProps> = ({
  open,
  loading,
  enabledTools,
  onClose,
  onToggle,
}) => {
  const tools = defaultTools.map(tool => ({
    ...tool,
    enabled: enabledTools.includes(tool.id),
  }));

  return (
    <Modal
      title="可用工具"
      open={open}
      onCancel={onClose}
      footer={null}
    >
      <List
        itemLayout="horizontal"
        dataSource={tools}
        renderItem={tool => (
          <List.Item
            actions={[
              <Switch
                key="toggle"
                checked={tool.enabled}
                onChange={checked => onToggle(tool.id, checked)}
                loading={loading}
              />
            ]}
          >
            <List.Item.Meta
              title={tool.name}
              description={tool.description}
            />
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default ToolsModal;
