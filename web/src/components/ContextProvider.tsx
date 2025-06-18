import React from 'react';
import { Outlet } from 'react-router-dom';
import { ModalProvider } from '@/contexts/ModalContext';
import { ListSelectionProvider } from '@/contexts/ListSelectionContext';

interface ContextProviderProps {
  children?: React.ReactNode;
}

export const ContextProvider: React.FC<ContextProviderProps> = ({ children }) => {
  return (
    <ModalProvider>
      <ListSelectionProvider>
        {children || <Outlet />}
      </ListSelectionProvider>
    </ModalProvider>
  );
};