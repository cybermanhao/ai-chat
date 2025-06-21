import { create } from 'zustand';
import { mcpStoreDefinition } from '@engine/store/mcpStore';

export const useMCPStore = create(mcpStoreDefinition);