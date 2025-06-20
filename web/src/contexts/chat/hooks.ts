import { useContext } from 'react';
import { ChatContext } from './context.ts';

export function useChatUI() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatUI must be used within a ChatProvider');
  }
  return context;
}
