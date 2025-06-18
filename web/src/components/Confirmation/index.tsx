import React from 'react';
import { Modal } from 'antd';
import type { ModalFuncProps } from 'antd';

export type ConfirmationType = 'info' | 'warning' | 'error' | 'confirm' | 'delete';

interface ConfirmationOptions extends Omit<ModalFuncProps, 'type'> {
  type?: ConfirmationType;
}

export const Confirmation = {
  confirm: (options: ConfirmationOptions) =>
    Modal.confirm({
      ...options,
      okText: options.okText || '确定',
      cancelText: options.cancelText || '取消',
    }),

  info: (options: Omit<ConfirmationOptions, 'type'>) =>
    Modal.info({
      ...options,
      okText: options.okText || '确定',
    }),

  warning: (options: Omit<ConfirmationOptions, 'type'>) =>
    Modal.warning({
      ...options,
      okText: options.okText || '确定',
    }),

  error: (options: Omit<ConfirmationOptions, 'type'>) =>
    Modal.error({
      ...options,
      okText: options.okText || '确定',
    }),

  delete: (options: Omit<ConfirmationOptions, 'type'>) =>
    Modal.confirm({
      ...options,
      okText: options.okText || '删除',
      okType: 'danger',
      okButtonProps: { danger: true },
    }),
};
