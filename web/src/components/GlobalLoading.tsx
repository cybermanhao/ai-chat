import React, { createContext, useContext, useState, useCallback } from 'react';
import './GlobalLoading.less';
import useGlobalUIStore from '@/store/globalUIStore';


interface GlobalLoadingContextType {
  count: number;
  show: () => void;
  hide: () => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType>({
  count: 0,
  show: () => {},
  hide: () => {},
});

export const useGlobalLoading = () => useContext(GlobalLoadingContext);

export const GlobalLoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [count, setCount] = useState(0);
  const show = useCallback(() => setCount(c => c + 1), []);
  const hide = useCallback(() => setCount(c => Math.max(0, c - 1)), []);
  return (
    <GlobalLoadingContext.Provider value={{ count, show, hide }}>
      {children}
    </GlobalLoadingContext.Provider>
  );
};

// 只需导出 Provider 和 useGlobalLoading，组件本身已自动读取 store
export { default as MemeLoading } from './memeLoading';
