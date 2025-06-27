import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface ThemeState {
  isDarkMode: boolean;
  dmMode: boolean;
}

const initialState: ThemeState = {
  isDarkMode: false,
  dmMode: false,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.isDarkMode = !state.isDarkMode;
    },
    setDMMode(state, action: PayloadAction<boolean>) {
      state.dmMode = action.payload;
    },
  },
});

export const { toggleTheme, setDMMode } = themeSlice.actions;
export default themeSlice.reducer;