import { useState } from 'react';

export interface EditableItemState<T> {
  item: T | null;
  originalItem: T | null;
  isDirty: boolean;
  isNew: boolean;
  validationErrors?: Record<keyof T, string>;
}

export interface EditableItemStateOptions<T> {
  onBeforeEdit?: (item: T) => void;
  onAfterEdit?: (item: T) => void;
  validate?: (item: T) => Record<keyof T, string> | undefined;
}

const createInitialState = <T>(): EditableItemState<T> => ({
  item: null,
  originalItem: null,
  isDirty: false,
  isNew: false,
});

interface EditableItemProps<T extends { id: string | number }> {
  item: T | null;
  onChange?: (item: T | null) => void;
  onBeforeEdit?: (item: T) => void;
  onAfterEdit?: (item: T) => void;
  validate?: (item: T) => Record<keyof T, string> | undefined;
  children: (props: {
    state: EditableItemState<T>;
    startEditing: (item: T) => void;
    startNew: () => void;
    updateField: <K extends keyof T>(field: K, value: T[K]) => void;
    save: () => boolean;
    cancel: () => void;
    reset: () => void;
    hasChanges: () => boolean;
    isValid: () => boolean;
  }) => React.ReactNode;
}

export function EditableItem<T extends { id: string | number }>(
  props: EditableItemProps<T>
) {
  const [state, setState] = useState<EditableItemState<T>>(() => createInitialState());

  const isValid = () => {
    if (!state.item || !props.validate) return true;
    const errors = props.validate(state.item);
    return !errors || Object.keys(errors).length === 0;
  };

  const updateState = (newState: Partial<EditableItemState<T>>) => {
    setState(prev => {
      const next = {
        ...prev,
        ...newState,
      };

      // Automatically calculate isDirty
      if (next.item && next.originalItem) {
        next.isDirty = JSON.stringify(next.item) !== JSON.stringify(next.originalItem);
      }

      // Run validation if provided
      if (props.validate && next.item) {
        next.validationErrors = props.validate(next.item);
      }

      return next;
    });
  };

  const startEditing = (item: T) => {
    props.onBeforeEdit?.(item);
    updateState({
      item: { ...item },
      originalItem: item,
      isDirty: false,
      isNew: false,
    });
    props.onAfterEdit?.(item);
  };

  const startNew = () => {
    const newItem = { id:  \`new-\${Date.now()}\` } as T;
    updateState({
      item: newItem,
      originalItem: null,
      isDirty: true,
      isNew: true,
    });
  };

  const updateField = <K extends keyof T>(field: K, value: T[K]) => {
    setState(prev => ({
      ...prev,
      item: prev.item ? { ...prev.item, [field]: value } : null,
    }));
  };

  const save = () => {
    if (!state.item || !isValid()) {
      return false;
    }
    updateState({ isDirty: false });
    props.onChange?.(state.item);
    return true;
  };

  const cancel = () => {
    updateState({
      item: state.originalItem,
      isDirty: false,
    });
    props.onChange?.(state.originalItem);
  };

  const reset = () => {
    setState(createInitialState());
    props.onChange?.(null);
  };

  const hasChanges = () => state.isDirty;

  return props.children({
    state,
    startEditing,
    startNew,
    updateField,
    save,
    cancel,
    reset,
    hasChanges,
    isValid,
  });
}
