import { useState } from 'react';

export interface ModalState<T = undefined> {
  visible: boolean;
  data: T | null;
}

export interface UseModalStateResult<T> {
  state: ModalState<T>;
  setState: (state: ModalState<T>) => void;
}

export const useModalState = <T = undefined>(
  initialState: Partial<ModalState<T>> = {}
): UseModalStateResult<T> => {
  const [state, setState] = useState<ModalState<T>>({
    visible: initialState.visible ?? false,
    data: initialState.data ?? null,
  });

  return {
    state,
    setState,
  };
};
