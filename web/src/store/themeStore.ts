import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

interface ThemeState {
  isDarkMode: boolean
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set) => ({
        isDarkMode: false,
        toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
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