export { default as ChatContext } from './context';
export { ChatProvider } from './ChatContext';
export * from './types';

// Hook must be in a separate file for React Refresh to work
export { useChatUI } from './hooks';
