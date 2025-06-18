import React, { useState } from 'react';
import { Modal } from 'antd';
import type { ModalProps } from 'antd';

export interface BaseModalProps extends Omit<ModalProps, 'visible' | 'onOk' | 'onCancel'> {
  open?: boolean;
  onClose?: () => void;
  afterClose?: () => void;
  onConfirm?: () => Promise<boolean> | boolean;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  open = false,
  onClose,
  afterClose,
  onConfirm,
  children,
  ...props
}) => {
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleOk = async () => {
    if (onConfirm) {
      setConfirmLoading(true);
      try {
        const result = await onConfirm();
        if (result) {
          onClose?.();
        }
      } finally {
        setConfirmLoading(false);
      }
    } else {
      onClose?.();
    }
  };

  return (
    <Modal
      {...props}
      open={open}
      confirmLoading={confirmLoading}
      onOk={handleOk}
      onCancel={onClose}
      afterClose={afterClose}
    >
      {children}
    </Modal>
  );
};
