import React, { useState, useEffect } from 'react';
import { Modal, Input } from 'antd';

interface SystemPromptModalProps {
  open: boolean;
  value: string;
  loading?: boolean;
  onOk: (value: string) => void;
  onCancel: () => void;
}

const SystemPromptModal: React.FC<SystemPromptModalProps> = ({
  open,
  value = '',
  loading,
  onOk,
  onCancel,
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleOk = () => {
    onOk(localValue);
    onCancel(); // 确定后自动关闭Modal
  };

  return (
    <Modal 
      title="系统提示词"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="确定"
      cancelText="取消"
      confirmLoading={loading}
    >
      <Input.TextArea
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        placeholder="输入系统提示词..."
        autoSize={{ minRows: 8, maxRows: 12 }}
      />
    </Modal>
  );
};

export default SystemPromptModal;
