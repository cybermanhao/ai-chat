import { create } from 'zustand';
import type { OpenAIModel, OpenAIEndpoint, OpenAIState, OpenAIEndpointCreate, OpenAIEndpointUpdate } from '@/types/openai';
import { OpenAIService } from '@/services/openaiService';

const defaultModels: OpenAIModel[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    maxTokens: 8192,
    type: 'gpt',
    inputTokenPrice: 0.03,
    outputTokenPrice: 0.06,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    maxTokens: 4096,
    type: 'gpt',
    inputTokenPrice: 0.0015,
    outputTokenPrice: 0.002,
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    maxTokens: 32768,
    type: 'gpt',
    inputTokenPrice: 0.001,
    outputTokenPrice: 0.001,
  },
];

interface OpenAIStoreState extends OpenAIState {
  service: OpenAIService;
  addEndpoint: (data: OpenAIEndpointCreate) => void;
  updateEndpoint: (id: string, data: OpenAIEndpointUpdate) => void;
  removeEndpoint: (id: string) => void;
  setActiveEndpoint: (id: string) => void;
  connect: (id: string) => Promise<void>;
  disconnect: (id: string) => void;
}

export const useOpenAIStore = create<OpenAIStoreState>((set, get) => ({
  service: new OpenAIService(),
  endpoints: [],
  defaultModels,
  activeEndpointId: undefined,

  addEndpoint: (data) => {
    const endpoint: OpenAIEndpoint = {
      id: crypto.randomUUID(),
      models: get().defaultModels,
      isConnected: false,
      ...data,
    };
    set((state) => ({
      endpoints: [...state.endpoints, endpoint],
    }));
  },

  updateEndpoint: (id, data) => {
    set((state) => ({
      endpoints: state.endpoints.map((ep) =>
        ep.id === id ? { ...ep, ...data } : ep
      ),
    }));
  },

  removeEndpoint: (id) => {
    const { service, disconnect } = get();
    if (service.getEndpoint()?.id === id) {
      disconnect(id);
    }
    set((state) => ({
      endpoints: state.endpoints.filter((ep) => ep.id !== id),
      activeEndpointId:
        state.activeEndpointId === id ? undefined : state.activeEndpointId,
    }));
  },

  setActiveEndpoint: (id) => {
    set({ activeEndpointId: id });
  },
  connect: async (id) => {
    const { endpoints, service } = get();
    const endpoint = endpoints.find((ep) => ep.id === id);
    if (!endpoint) {
      throw new Error(`Endpoint with id ${id} not found`);
    }

    try {
      service.initialize(endpoint);
      
      set((state) => ({
        endpoints: state.endpoints.map((ep) =>
          ep.id === id ? { ...ep, isConnected: true, error: undefined } : ep
        ),
        activeEndpointId: id,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set((state) => ({
        endpoints: state.endpoints.map((ep) =>
          ep.id === id ? { ...ep, isConnected: false, error: errorMessage } : ep
        ),
      }));
      throw error;
    }
  },

  disconnect: (id) => {
    const { service } = get();
    service.disconnect();
    set((state) => ({
      endpoints: state.endpoints.map((ep) =>
        ep.id === id ? { ...ep, isConnected: false } : ep
      ),
      activeEndpointId:
        state.activeEndpointId === id ? undefined : state.activeEndpointId,
    }));
  },
}));
