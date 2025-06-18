import { useState } from 'react';

export const useModal = <T>(initialData: T | null = null) => {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<T | null>(initialData);

  const open = (newData?: T) => {
    setVisible(true);
    if (newData !== undefined) {
      setData(newData);
    }
  };

  const close = () => {
    setVisible(false);
    setData(null);
  };

  return {
    visible,
    data,
    open,
    close,
  };
};
