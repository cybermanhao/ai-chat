import PubStore from 'zustand-pub';
import { modelConfigStoreDefinition } from '@engine/store/modelConfigStore';

const pubStore = new PubStore('modelConfig');
export const useModelConfigStore = pubStore.defineStore('modelConfig', modelConfigStoreDefinition);
