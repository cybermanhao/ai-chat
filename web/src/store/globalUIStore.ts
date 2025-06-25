import { create } from 'zustand';

interface GlobalUIStore {
  loadingCount: number;
  showLoading: () => void;
  hideLoading: () => void;
  dmMode: boolean;
  setDMMode: (value: boolean) => void;
}

export const useGlobalUIStore = create<GlobalUIStore>((set) => ({
  loadingCount: 0,
  showLoading: () => set((state) => ({ loadingCount: state.loadingCount + 1 })),
  hideLoading: () => set((state) => ({ loadingCount: Math.max(0, state.loadingCount - 1) })),
  dmMode: false,
  setDMMode: (value) => set({ dmMode: value }),
}));
