import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface GlobalUIState {
  loadingCount: number;
  dmMode: boolean;
}

const initialState: GlobalUIState = {
  loadingCount: 0,
  dmMode: false,
};

const globalUISlice = createSlice({
  name: 'globalUI',
  initialState,
  reducers: {
    showLoading(state) {
      state.loadingCount += 1;
    },
    hideLoading(state) {
      state.loadingCount = Math.max(0, state.loadingCount - 1);
    },
    setDMMode(state, action: PayloadAction<boolean>) {
      state.dmMode = action.payload;
    },
  },
});

export const { showLoading, hideLoading, setDMMode } = globalUISlice.actions;
export default globalUISlice.reducer;
