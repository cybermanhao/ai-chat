import PubStore from 'zustand-pub';
import { mcpStoreDefinition } from '@engine/store/mcpStore';

const pubStore = new PubStore('mcp');
export const useMCPStore = pubStore.defineStore('mcp', mcpStoreDefinition);