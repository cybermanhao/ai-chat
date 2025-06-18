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
  onClose: () => void;
  tools: Tool[];
  onToolToggle: (toolId: string, enabled: boolean) => void;
}

const ToolsModal: React.FC<ToolsModalProps> = ({
  open,
  onClose,
  tools,
  onToolToggle,
}) => {
  return (
    <Modal 
      title="工具箱"
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
                checked={tool.enabled}
                onChange={(checked) => onToolToggle(tool.id, checked)}
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
