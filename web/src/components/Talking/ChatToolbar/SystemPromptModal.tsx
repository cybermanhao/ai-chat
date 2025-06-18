import React from 'react';
import { Modal, Input } from 'antd';

interface SystemPromptModalProps {
  open: boolean;
  onClose: () => void;
  value?: string;
  onChange?: (value: string) => void;
}

const SystemPromptModal: React.FC<SystemPromptModalProps> = ({
  open,
  onClose,
  value = '',
  onChange,
}) => {
  return (
    <Modal 
      title="系统提示词"
      open={open}
      onCancel={onClose}
      footer={null}
    >
      <Input.TextArea
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder="设置系统提示词以定制AI助手的行为..."
        autoSize={{ minRows: 8, maxRows: 12 }}
      />
    </Modal>
  );
};

export default SystemPromptModal;
