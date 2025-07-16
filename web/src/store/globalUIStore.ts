import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface GlobalUIState {
  loadingCount: number;
  dmMode: boolean;
  memeLoadingVisible: boolean;
  memeLoadingBlur: boolean;
}

const initialState: GlobalUIState = {
  loadingCount: 0,
  dmMode: false,
  memeLoadingVisible: false,
  memeLoadingBlur: false, // 默认关闭高斯模糊
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
    setMemeLoadingVisible(state, action: PayloadAction<boolean>) {
      state.memeLoadingVisible = action.payload;
    },
    setMemeLoadingBlur(state, action: PayloadAction<boolean>) {
      state.memeLoadingBlur = action.payload;
    },
  },
});

export const { showLoading, hideLoading, setDMMode, setMemeLoadingVisible, setMemeLoadingBlur } = globalUISlice.actions;
export default globalUISlice.reducer;
