import React, { useState, useCallback } from 'react';

export interface SelectionState<T> {
  selectedItem: T | null;
  lastSelected?: T | null;
  selectionMode?: 'single' | 'multiple';
  selectedItems?: T[];
}

interface SelectableListProps<T extends { id: string | number }> {
  items: T[];
  initialSelection?: T | null;
  selectionMode?: 'single' | 'multiple';
  onChange?: (selectedItems: T[]) => void;
  children: (props: {
    state: SelectionState<T>;
    select: (item: T) => void;
    deselect: (item: T) => void;
    clearSelection: () => void;
    isSelected: (item: T) => boolean;
    toggleSelection: (item: T) => void;
  }) => React.ReactNode;
}

export function SelectableList<T extends { id: string | number }>(
  props: SelectableListProps<T>
) {
  const [state, setState] = useState<SelectionState<T>>({
    selectedItem: props.initialSelection ?? null,
    lastSelected: null,
    selectionMode: props.selectionMode ?? 'single',
    selectedItems: props.initialSelection ? [props.initialSelection] : [],
  });

  const select = useCallback((item: T) => {
    setState(prev => {
      if (prev.selectionMode === 'single') {
        const newState = {
          ...prev,
          selectedItem: item,
          lastSelected: prev.selectedItem,
          selectedItems: [item],
        };
        props.onChange?.(newState.selectedItems);
        return newState;
      }
      const newState = {
        ...prev,
        selectedItems: [...prev.selectedItems!, item],
        lastSelected: prev.selectedItem,
      };
      props.onChange?.(newState.selectedItems);
      return newState;
    });
  }, [props.onChange]);

  const deselect = useCallback((item: T) => {
    setState(prev => {
      if (prev.selectionMode === 'single') {
        const newState = {
          ...prev,
          selectedItem: null,
          lastSelected: prev.selectedItem,
          selectedItems: [],
        };
        props.onChange?.(newState.selectedItems);
        return newState;
      }
      const newState = {
        ...prev,
        selectedItems: prev.selectedItems!.filter(i => i.id !== item.id),
        lastSelected: prev.selectedItem,
      };
      props.onChange?.(newState.selectedItems);
      return newState;
    });
  }, [props.onChange]);

  const clearSelection = useCallback(() => {
    setState(prev => {
      const newState = {
        ...prev,
        selectedItem: null,
        selectedItems: [],
        lastSelected: prev.selectedItem,
      };
      props.onChange?.(newState.selectedItems);
      return newState;
    });
  }, [props.onChange]);

  const isSelected = useCallback(
    (item: T) => {
      return state.selectionMode === 'single'
        ? state.selectedItem?.id === item.id
        : state.selectedItems!.some(i => i.id === item.id);
    },
    [state]
  );

  const toggleSelection = useCallback(
    (item: T) => {
      if (isSelected(item)) {
        deselect(item);
      } else {
        select(item);
      }
    },
    [select, deselect, isSelected]
  );

  return props.children({
    state,
    select,
    deselect,
    clearSelection,
    isSelected,
    toggleSelection,
  });
}
