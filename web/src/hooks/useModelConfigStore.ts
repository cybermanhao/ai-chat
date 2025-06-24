import { create } from 'zustand';
import { modelConfigStoreDefinition } from '@engine/store/modelConfigStore';

export const useModelConfigStore = create(modelConfigStoreDefinition);
