// engine/store/themeStore.ts
// 多端同构 Theme store 纯逻辑定义
export interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const themeStoreDefinition = (set: any) => ({
  isDarkMode: false,
  toggleTheme: () => set((state: ThemeState) => ({ isDarkMode: !state.isDarkMode })),
});
