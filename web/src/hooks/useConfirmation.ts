import { useState, useCallback, useMemo } from 'react';

export type ConfirmationType = 'info' | 'warning' | 'error' | 'confirm' | 'delete';

export interface ConfirmationButton {
  text: string;
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  danger?: boolean;
  onClick?: () => void;
}

export interface ConfirmState {
  isOpen: boolean;
  type: ConfirmationType;
  title: string;
  message: string;
  okButton?: ConfirmationButton;
  cancelButton?: ConfirmationButton;
  icon?: React.ReactNode;
  resolvePromise?: (value: boolean) => void;
}

export interface ConfirmOptions {
  type?: ConfirmationType;
  okText?: string;
  cancelText?: string;
  okType?: ConfirmationButton['type'];
  cancelType?: ConfirmationButton['type'];
  okDanger?: boolean;
  icon?: React.ReactNode;
  onOk?: () => void;
  onCancel?: () => void;
}

const initialState: ConfirmState = {
  isOpen: false,
  type: 'confirm',
  title: '',
  message: '',
};

const defaultOptions: Required<Omit<ConfirmOptions, 'onOk' | 'onCancel' | 'icon'>> = {
  type: 'confirm',
  okText: '确定',
  cancelText: '取消',
  okType: 'primary',
  cancelType: 'default',
  okDanger: false,
};

export interface UseConfirmStateResult {
  state: ConfirmState;
  confirm: (title: string, message: string, options?: ConfirmOptions) => Promise<boolean>;
  info: (title: string, message: string, options?: Omit<ConfirmOptions, 'type'>) => Promise<boolean>;
  warning: (title: string, message: string, options?: Omit<ConfirmOptions, 'type'>) => Promise<boolean>;
  error: (title: string, message: string, options?: Omit<ConfirmOptions, 'type'>) => Promise<boolean>;
  delete: (title: string, message: string, options?: Omit<ConfirmOptions, 'type'>) => Promise<boolean>;
  close: (result: boolean) => void;
}

export const useConfirmState = (
  customDefaultOptions?: Partial<typeof defaultOptions>
): UseConfirmStateResult => {
  const [state, setState] = useState<ConfirmState>(initialState);
  
  const mergedDefaults = useMemo(() => 
    ({ ...defaultOptions, ...customDefaultOptions }),
    [customDefaultOptions]
  );

  const createConfirmation = useCallback((
    type: ConfirmationType,
    title: string, 
    message: string,
    options: ConfirmOptions = {}
  ) => {
    return new Promise<boolean>((resolve) => {
      const mergedOptions = {
        ...mergedDefaults,
        ...options,
        type,
      };

      setState({
        isOpen: true,
        type: mergedOptions.type,
        title,
        message,
        okButton: {
          text: mergedOptions.okText,
          type: mergedOptions.okType,
          danger: mergedOptions.okDanger,
          onClick: mergedOptions.onOk,
        },
        cancelButton: {
          text: mergedOptions.cancelText,
          type: mergedOptions.cancelType,
          onClick: mergedOptions.onCancel,
        },
        icon: mergedOptions.icon,
        resolvePromise: resolve,
      });
    });
  }, [mergedDefaults]);

  const confirm = useCallback((title: string, message: string, options?: ConfirmOptions) => 
    createConfirmation('confirm', title, message, options),
  [createConfirmation]);

  const info = useCallback((title: string, message: string, options?: Omit<ConfirmOptions, 'type'>) => 
    createConfirmation('info', title, message, options),
  [createConfirmation]);

  const warning = useCallback((title: string, message: string, options?: Omit<ConfirmOptions, 'type'>) => 
    createConfirmation('warning', title, message, options),
  [createConfirmation]);

  const error = useCallback((title: string, message: string, options?: Omit<ConfirmOptions, 'type'>) => 
    createConfirmation('error', title, message, options),
  [createConfirmation]);

  const delete_ = useCallback((title: string, message: string, options?: Omit<ConfirmOptions, 'type'>) => 
    createConfirmation('delete', title, message, { 
      okDanger: true, 
      okText: '删除',
      ...options,
    }),
  [createConfirmation]);

  const close = useCallback((result: boolean) => {
    state.resolvePromise?.(result);
    setState(initialState);
  }, [state]);

  return {
    state,
    confirm,
    info,
    warning,
    error,
    delete: delete_,
    close,
  };
};
