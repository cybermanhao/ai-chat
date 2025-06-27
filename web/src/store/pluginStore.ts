// ========================================
// [插件系统已禁用] - 插件系统尚未完善，暂时停止开发
// 本文件保留redux slice类型定义，但注释掉reducer和action导出
// 如需恢复插件功能，请取消相关注释并完善插件系统实现
// ========================================

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
// [插件系统已禁用] - 注释掉插件类型导入
// import type { Plugin } from '@engine/types/plugin';

// [插件系统已禁用] - 保留接口定义，但注释掉实际使用
/*
interface PluginState {
  plugins: Plugin[];
  configs: Record<string, Record<string, unknown>>;
}
*/

// [插件系统已禁用] - 使用空接口，防止类型错误
interface PluginState {
  plugins: any[];
  configs: Record<string, Record<string, unknown>>;
}

const initialState: PluginState = {
  plugins: [],
  configs: {},
};

// [插件系统已禁用] - 注释掉插件相关的reducer逻辑
/*
const pluginSlice = createSlice({
  name: 'plugin',
  initialState,
  reducers: {
    addPlugin(state, action: PayloadAction<Plugin>) {
      state.plugins.push(action.payload);
      state.configs[action.payload.id] = {
        enabled: true,
        ...action.payload.config,
      };
    },
    removePlugin(state, action: PayloadAction<string>) {
      state.plugins = state.plugins.filter(p => p.id !== action.payload);
      const { [action.payload]: _, ...restConfigs } = state.configs;
      state.configs = restConfigs;
    },
    enablePlugin(state, action: PayloadAction<string>) {
      if (state.configs[action.payload]) {
        state.configs[action.payload].enabled = true;
      }
    },
    disablePlugin(state, action: PayloadAction<string>) {
      if (state.configs[action.payload]) {
        state.configs[action.payload].enabled = false;
      }
    },
    updatePluginConfig(state, action: PayloadAction<{ id: string; config: Record<string, unknown> }>) {
      const { id, config } = action.payload;
      state.configs[id] = {
        ...state.configs[id],
        ...config,
      };
    },
  },
});
*/

// [插件系统已禁用] - 创建空的slice，防止其他模块引用出错
const pluginSlice = createSlice({
  name: 'plugin',
  initialState,
  reducers: {
    // 空的reducer，不执行任何操作
    addPlugin: (state, action: PayloadAction<any>) => {
      console.log('[插件系统已禁用] addPlugin 已停用');
    },
    removePlugin: (state, action: PayloadAction<string>) => {
      console.log('[插件系统已禁用] removePlugin 已停用');
    },
    enablePlugin: (state, action: PayloadAction<string>) => {
      console.log('[插件系统已禁用] enablePlugin 已停用');
    },
    disablePlugin: (state, action: PayloadAction<string>) => {
      console.log('[插件系统已禁用] disablePlugin 已停用');
    },
    updatePluginConfig: (state, action: PayloadAction<{ id: string; config: Record<string, unknown> }>) => {
      console.log('[插件系统已禁用] updatePluginConfig 已停用');
    },
  },
});

// getSystemPrompts 建议在 selector 层实现
export const { addPlugin, removePlugin, enablePlugin, disablePlugin, updatePluginConfig } = pluginSlice.actions;
export default pluginSlice.reducer;
