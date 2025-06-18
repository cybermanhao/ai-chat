import { useCallback } from 'react';
import { useOpenAIStore } from '@/store/openaiStore';
import type { OpenAIEndpoint, OpenAIEndpointCreate, OpenAIEndpointUpdate, ChatCompletionOptions, ChatCompletionResponse } from '@/types/openai';

interface UseOpenAIEndpointResult {
  // 状态
  endpoints: OpenAIEndpoint[];
  activeEndpointId?: string;

  // 数据操作
  createEndpoint: (data: OpenAIEndpointCreate) => void;
  updateEndpoint: (id: string, data: OpenAIEndpointUpdate) => void;
  removeEndpoint: (id: string) => void;
  setActiveEndpoint: (id: string) => void;
  
  // 连接操作
  connectEndpoint: (id: string) => Promise<void>;
  disconnectEndpoint: (id: string) => void;

  // API操作
  createChatCompletion: (options: ChatCompletionOptions) => Promise<ChatCompletionResponse>;

  // 查询方法
  getEndpointById: (id: string) => OpenAIEndpoint | undefined;
  getActiveEndpoint: () => OpenAIEndpoint | undefined;
}

export const useOpenAIEndpoint = (): UseOpenAIEndpointResult => {
  const {
    service,
    endpoints,
    activeEndpointId,
    addEndpoint,
    removeEndpoint,
    updateEndpoint,
    setActiveEndpoint,
    connect,
    disconnect,
  } = useOpenAIStore();

  const createEndpoint = useCallback((data: OpenAIEndpointCreate) => {
    addEndpoint(data);
  }, [addEndpoint]);

  const connectEndpoint = useCallback(async (id: string) => {
    await connect(id);
  }, [connect]);

  const disconnectEndpoint = useCallback((id: string) => {
    disconnect(id);
  }, [disconnect]);

  const getEndpointById = useCallback((id: string) => {
    return endpoints.find(ep => ep.id === id);
  }, [endpoints]);

  const getActiveEndpoint = useCallback(() => {
    return activeEndpointId ? getEndpointById(activeEndpointId) : undefined;
  }, [activeEndpointId, getEndpointById]);

  const createChatCompletion = useCallback(async (options: ChatCompletionOptions) => {
    if (!service.isInitialized()) {
      throw new Error('No active OpenAI endpoint. Please connect to an endpoint first.');
    }
    return service.createChatCompletion(options);
  }, [service]);

  return {
    // 状态
    endpoints,
    activeEndpointId,

    // 数据操作
    createEndpoint,
    updateEndpoint,
    removeEndpoint,
    setActiveEndpoint,

    // 连接操作
    connectEndpoint,
    disconnectEndpoint,

    // API操作
    createChatCompletion,

    // 查询方法
    getEndpointById,
    getActiveEndpoint,
  };
};
