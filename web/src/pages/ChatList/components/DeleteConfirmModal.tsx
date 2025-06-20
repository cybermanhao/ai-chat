import React from 'react';
import { Modal } from 'antd';

interface DeleteConfirmModalProps {
  visible: boolean;
  chatId: string | null;
  onConfirm: (chatId: string) => Promise<void>;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  visible,
  chatId,
  onConfirm,
  onCancel,
}) => {
  const handleConfirm = async () => {
    if (chatId) {
      await onConfirm(chatId);
    }
  };

  return (
    <Modal
      title="确认删除"
      open={visible}
      onOk={handleConfirm}
      onCancel={onCancel}
      okText="删除"
      okType="danger"
      cancelText="取消"
    >
      <p>确定要删除这个对话吗？此操作不可恢复。</p>
    </Modal>
  );
};

export default DeleteConfirmModal;
