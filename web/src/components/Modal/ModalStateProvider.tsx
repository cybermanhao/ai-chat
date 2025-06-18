import React, { useState } from 'react';

export interface ModalState<T> {
  visible: boolean;
  data: T | null;
}

interface ModalStateProviderProps<T> {
  initiallyVisible?: boolean;
  initialData?: T | null;
  onShow?: (data?: T) => void;
  onHide?: () => void;
  children: (props: {
    state: ModalState<T>;
    show: (data?: T) => void;
    hide: () => void;
  }) => React.ReactNode;
}

export function ModalStateProvider<T>({
  initiallyVisible = false,
  initialData = null,
  onShow,
  onHide,
  children,
}: ModalStateProviderProps<T>) {
  const [state, setState] = useState<ModalState<T>>({
    visible: initiallyVisible,
    data: initialData,
  });

  const show = (data?: T) => {
    setState({ visible: true, data: data ?? null });
    onShow?.(data);
  };

  const hide = () => {
    setState({ visible: false, data: null });
    onHide?.();
  };

  return children({
    state,
    show,
    hide,
  });
}
