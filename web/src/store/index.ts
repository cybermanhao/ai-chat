import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage

import chatReducer from './chatSlice';
import globalUIReducer from './globalUIStore';
import themeReducer from './themeStore';
import roleReducer from './roleStore';
import pluginReducer from './pluginStore';
import mcpReducer from './mcpStore';
import llmConfigReducer from './llmConfigSlice';
import taskLoopMiddleware from './streamManagerMiddleware'; // 重命名后的中间件
import { storageMiddleware } from './storageMiddleware'; // 添加自定义存储中间件

const persistConfig = {
  key: 'root',
  storage,
  // 白名单，只持久化以下 slice
  whitelist: ['theme', 'role', 'plugin', 'mcp', 'chat', 'llmConfig'],
};

const rootReducer = combineReducers({
  chat: chatReducer,
  globalUI: globalUIReducer,
  theme: themeReducer,
  role: roleReducer,
  plugin: pluginReducer,
  mcp: mcpReducer,
  llmConfig: llmConfigReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略 redux-persist 的 action 类型
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(taskLoopMiddleware, storageMiddleware), // 集成 taskLoopMiddleware 和 storageMiddleware
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;