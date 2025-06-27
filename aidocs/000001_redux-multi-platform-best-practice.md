# Redux 多端复用最佳实践（Web/Node/Electron/Engine）

## 1. 架构目标与原则
- **业务逻辑、数据结构、类型、工具函数全部沉淀在 engine 层**，做到 web/node/electron/脚本/测试等多端完全复用。
- **UI 层（web、electron 渲染进程）只用 Redux hooks（useSelector/useDispatch）连接 Redux store**，不关心业务细节。
- **Node、Electron 主进程等非 UI 端直接用 Redux 原生 API（dispatch/getState）操作 store**。
- **类型、工具、模型全部放 engine/types、engine/utils，三端可用。**
- **跨进程/多端同步只同步必要的全局配置，避免大规模状态同步。**

---

## 2. 推荐目录结构
```
engine/
  store/
    llmConfigSlice.ts   # 纯 slice/reducer
  utils/
    llms.ts
  types/
    llm.ts
web/
  src/
    store/
      index.ts          # 只负责 combineReducers
    pages/
      Settings.tsx      # 用 useSelector/useDispatch
    ...
electron/
  main.js               # 主进程，直接 import engine slice
  renderer/
    store/
      index.ts          # 和 web 一样
    pages/
      Settings.tsx      # 和 web 一样
node/
  scripts/
    test-llmConfig.js   # 直接 import engine slice
```

---

## 3. engine 层 slice/reducer/类型/工具写法与复用
- 只用 TypeScript/JavaScript，导出 class、函数、类型、slice/reducer。
- 不 import React，不用 hooks。
- 例如：
```ts
// engine/store/llmConfigSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { llms } from '../utils/llms';

export interface LLMConfigState {
  activeLLMId: string;
  apiKey: string;
  userModel: string;
}

const defaultLLM = llms[0];

const initialState: LLMConfigState = {
  activeLLMId: defaultLLM.id,
  apiKey: '',
  userModel: defaultLLM.userModel || '',
};

const llmConfigSlice = createSlice({
  name: 'llmConfig',
  initialState,
  reducers: {
    setActiveLLMId(state, action: PayloadAction<string>) {
      state.activeLLMId = action.payload;
      const llm = llms.find(l => l.id === action.payload);
      if (llm && llm.userModel) state.userModel = llm.userModel;
    },
    setApiKey(state, action: PayloadAction<string>) {
      state.apiKey = action.payload;
    },
    setUserModel(state, action: PayloadAction<string>) {
      state.userModel = action.payload;
    },
  },
});

export const { setActiveLLMId, setApiKey, setUserModel } = llmConfigSlice.actions;
export default llmConfigSlice.reducer;
```
- 类型、工具、模型全部放 engine/types、engine/utils，web/node/electron 都能 import。

---

## 4. web/electron 渲染进程如何用 Redux hooks
- 只在 React 组件里用 `useSelector`、`useDispatch`。
- Redux store 直接引入 engine 层 slice。
- 组件只关心 UI，所有业务逻辑都在 engine 层。

```ts
// web/src/store/index.ts & electron/renderer/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import llmConfigReducer from '@engine/store/llmConfigSlice';
export const store = configureStore({ reducer: { llmConfig: llmConfigReducer } });
```

```tsx
// web/src/pages/Settings.tsx & electron/renderer/pages/Settings.tsx
import { useSelector, useDispatch } from 'react-redux';
const llmConfig = useSelector(state => state.llmConfig);
```

---

## 5. node/electron 主进程如何用原生 Redux API
- 直接 `configureStore`，用 action 操作数据。
- 直接 import engine 层 slice/reducer，和 web 端完全一致。

```js
// electron/main.js（主进程）
const { configureStore } = require('@reduxjs/toolkit');
const llmConfigReducer = require('../engine/store/llmConfigSlice').default;
const { setActiveLLMId } = require('../engine/store/llmConfigSlice');

const store = configureStore({ reducer: { llmConfig: llmConfigReducer } });
store.dispatch(setActiveLLMId('deepseek'));
console.log(store.getState().llmConfig);
// 可通过 electron IPC 把主进程的配置同步给渲染进程
```

---

## 6. 跨进程/多端同步建议
- 主进程监听配置变更，通过 IPC 通知渲染进程。
- 渲染进程修改配置时，通过 IPC 通知主进程同步。
- 只同步必要的全局配置，避免大规模状态同步。
- 业务数据各自维护，配置类数据可同步。

---

## 7. 总结与注意事项
- engine 层 slice/reducer/工具/类型四端（web/node/electron/engine）完全复用。
- web/electron 渲染进程用 Redux hooks，主进程/node 用原生 Redux API。
- 类型、工具、模型全部放 engine/types、engine/utils。
- 跨进程同步用 IPC，保持配置一致性。
- engine 层绝不 import React/前端依赖，保证纯净。

---

如需具体迁移脚本或样板代码，或有特殊业务场景，欢迎团队成员随时补充！ 