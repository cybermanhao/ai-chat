import React, { createContext, useContext, useState } from 'react';

interface ListSelectionContextType<T> {
  selectedItems: T[];
  selectedKeys: string[];
  handleSelect: (item: T, key: string) => void;
  handleSelectMultiple: (items: T[], keys: string[]) => void;
  clearSelection: () => void;
}

const ListSelectionContext = createContext<ListSelectionContextType<any> | null>(null);

interface ListSelectionProviderProps<T extends { id?: string }> {
  children: React.ReactNode;
  keyExtractor?: (item: T) => string;
}

export function ListSelectionProvider<T extends { id?: string }>({ children, keyExtractor = (item: T) => item.id ?? '' }: ListSelectionProviderProps<T>) {
  const [selectedItems, setSelectedItems] = useState<T[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const handleSelect = (item: T, key?: string) => {
    setSelectedItems([item]);
    setSelectedKeys([key ?? keyExtractor(item)]);
  };

  const handleSelectMultiple = (items: T[], keys?: string[]) => {
    setSelectedItems(items);
    setSelectedKeys(keys ?? items.map(keyExtractor));
  };

  const clearSelection = () => {
    setSelectedItems([]);
    setSelectedKeys([]);
  };

  return (
    <ListSelectionContext.Provider 
      value={{ 
        selectedItems, 
        selectedKeys, 
        handleSelect, 
        handleSelectMultiple,
        clearSelection 
      }}
    >
      {children}
    </ListSelectionContext.Provider>
  );
}

export function useListSelection<T>() {
  const context = useContext(ListSelectionContext);
  if (!context) {
    throw new Error('useListSelection must be used within a ListSelectionProvider');
  }
  return context as ListSelectionContextType<T>;
}
