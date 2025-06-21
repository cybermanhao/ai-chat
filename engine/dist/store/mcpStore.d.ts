export interface Tool {
    name: string;
    description: string;
}
export interface MCPServer {
    id: string;
    name: string;
    url: string;
    isConnected: boolean;
    tools: Tool[];
    error?: string;
}
export interface Message {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    toolName?: string;
    toolArgs?: Record<string, unknown>;
}
export interface MCPState {
    servers: MCPServer[];
    activeServerId?: string;
    isLoading: boolean;
    messages: Message[];
    currentModel: string;
    addServer: (name: string, url: string) => void;
    removeServer: (id: string) => void;
    updateServer: (id: string, data: Partial<MCPServer>) => void;
    setActiveServer: (id: string) => void;
    addMessage: (message: Message) => void;
    updateLastMessage: (content: string) => void;
    clearMessages: () => void;
    setCurrentModel: (modelName: string) => void;
    connectServer: (id: string) => void;
    disconnectServer: (id: string) => void;
}
export declare const mcpStoreDefinition: (set: any) => {
    servers: never[];
    activeServerId: undefined;
    messages: never[];
    isLoading: boolean;
    currentModel: string;
    addServer: (name: string, url: string) => void;
    removeServer: (id: string) => void;
    updateServer: (id: string, data: Partial<MCPServer>) => void;
    setActiveServer: (id: string) => void;
    addMessage: (message: Message) => void;
    updateLastMessage: (content: string) => void;
    clearMessages: () => void;
    setCurrentModel: (modelName: string) => void;
    connectServer: (id: string) => Promise<void>;
    disconnectServer: (id: string) => void;
};
//# sourceMappingURL=mcpStore.d.ts.map