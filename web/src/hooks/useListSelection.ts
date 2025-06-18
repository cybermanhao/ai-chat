import { useState } from 'react';

export const useSelection = <T extends { id: string | number }>(initialSelection: T | null = null) => {
  const [selected, setSelected] = useState<T | null>(initialSelection);

  const select = (item: T) => {
    setSelected(item);
  };

  const deselect = () => {
    setSelected(null);
  };

  const toggle = (item: T) => {
    if (selected?.id === item.id) {
      deselect();
    } else {
      select(item);
    }
  };

  const isSelected = (item: T) => {
    return selected?.id === item.id;
  };

  return {
    selected,
    select,
    deselect,
    toggle,
    isSelected,
  };
};
