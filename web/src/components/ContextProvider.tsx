import React from 'react';
import { Outlet } from 'react-router-dom';

// 临时注释 ModalProvider 和 ListSelectionProvider，防止构建报错。请补充实现或移除相关依赖。
// import { ModalProvider } from '@/contexts/ModalContext';
// import { ListSelectionProvider } from '@/contexts/ListSelectionContext';

interface ContextProviderProps {
  children?: React.ReactNode;
}

export const ContextProvider: React.FC<ContextProviderProps> = ({ children }) => {
  // 只渲染 children 或 Outlet
  return <>{children ?? <Outlet />}</>;
};