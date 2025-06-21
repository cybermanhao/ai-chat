import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

interface ThemeState {
  isDarkMode: boolean
  toggleTheme: () => void
  dmMode: boolean
  setDMMode: (value: boolean) => void
}

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set) => ({
        isDarkMode: false,
        toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
        dmMode: false,
        setDMMode: (value: boolean) => set({ dmMode: value }),
      }),
      {
        name: 'theme-storage',
      }
    ),
    {
      name: 'theme-store',
    }
  )
)