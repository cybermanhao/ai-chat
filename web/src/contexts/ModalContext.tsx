import React, { createContext, useContext, useState, useCallback } from 'react';

interface ModalContextType {
  visible: boolean;
  show: () => void;
  hide: () => void;
  toggle: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

interface ModalProviderProps {
  children: React.ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);
  const toggle = useCallback(() => setVisible(prev => !prev), []);

  return (
    <ModalContext.Provider value={{ visible, show, hide, toggle }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
