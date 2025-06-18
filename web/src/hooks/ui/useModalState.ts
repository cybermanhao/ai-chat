import { useState } from 'react';

export interface ModalState<T> {
  visible: boolean;
  data: T | null;
}

export const useModalState = <T>(initialData: T | null = null) => {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<T | null>(initialData);

  const setVisibleWithData = (isVisible: boolean, newData?: T) => {
    setVisible(isVisible);
    if (isVisible && newData !== undefined) {
      setData(newData);
    } else if (!isVisible) {
      setData(null);
    }
  };

  return {
    visible,
    data,
    setVisible: setVisibleWithData,
  };
};
