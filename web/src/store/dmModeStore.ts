import { create } from 'zustand';

interface DMModeStore {
  dmMode: boolean;
  setDMMode: (value: boolean) => void;
}

export const useDMModeStore = create<DMModeStore>((set) => ({
  dmMode: false,
  setDMMode: (value) => set({ dmMode: value }),
}));
