import { createContext } from 'react';
import type { ChatContextValue } from './types';

const ChatContext = createContext<ChatContextValue | null>(null);

export default ChatContext;
