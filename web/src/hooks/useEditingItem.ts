import { useState } from 'react';

export interface EditingState<T> {
  item: T | null;
  isEditing: boolean;
}

export const useEditingItem = <T extends { id: string | number }>(initialItem: T | null = null) => {
  const [state, setState] = useState<EditingState<T>>({
    item: initialItem,
    isEditing: false
  });

  const startEditing = (item: T) => {
    setState({
      item: { ...item },
      isEditing: true
    });
  };

  const stopEditing = () => {
    setState({
      item: null,
      isEditing: false
    });
  };

  const updateItem = (newItem: T) => {
    setState({
      item: newItem,
      isEditing: true
    });
  };

  return {
    item: state.item,
    isEditing: state.isEditing,
    startEditing,
    stopEditing,
    updateItem
  };
};
