# MemeLoading 组件

模仿《小林家的龙女仆》片头弹幕风格的趣味载入动画！

你可以自定义 meme 弹幕内容，让 loading 过程不再无聊。支持一键切换“DM模式”降级为纯遮罩，照顾讨厌弹幕的同学，老板/家长/严肃场合也能安心用。

- 默认内置一大堆梗弹幕，支持自定义。
- safemod（安全模式）一开，立刻变身安静的 loading 遮罩，啥都不显示。
- 支持彩蛋模式，trueFan=true 时永远显示“苟利国家生死已，岂因祸福避趋之”。
- 动画加速、背景色、最短显示时间等都能自定义。
- TypeScript 智能提示，参数一目了然。

让你的 loading 也能“龙女仆”起来，快乐开发，快乐等候！

## 用法

```tsx
import MemeLoading, { defaultMemesSet } from './MemeLoading';

<MemeLoading
  loadingSignal={loading}
  safemod={false}
  minDuration={0.3}
  boostDuration={0.2}
  memes={defaultMemesSet}
  backgroundColor="#222"
/>
```

## Props

| 参数             | 类型         | 说明                                                         |
|------------------|--------------|--------------------------------------------------------------|
| loadingSignal    | boolean/number | 是否显示 loading 遮罩，队列模式下为 number（>0 显示）         |
| queueMode        | boolean      | 是否启用队列/计数模式，true 时 loadingSignal 为 number        |
| trueFan          | boolean      | 彩蛋模式，true 时固定显示第 29 条 meme                        |
| memes            | string[]     | 可自定义 meme 列表，默认内置 defaultMemesSet                 |
| backgroundColor  | string       | 遮罩背景色                                                   |
| minDuration      | number       | 最短显示时间（秒），safemod=true 时为0，否则为0.5              |
| safemod          | boolean      | 安全模式，true 时不显示字符且所有动画加速为 0.1 秒           |
| boostDuration    | number       | boot 阶段加速时间（秒），safemod=true 时强制为 0.1           |

## 全局 loading 队列管理（推荐 useContext 实现）

建议在 App 根组件引入 MemeLoading，并用 React Context 管理全局 loading 计数。

### 1. 创建全局 LoadingContext

```tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

export const LoadingContext = createContext({
  count: 0,
  show: () => {},
  hide: () => {},
});

export const useGlobalLoading = () => useContext(LoadingContext);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [count, setCount] = useState(0);
  const show = useCallback(() => setCount(c => c + 1), []);
  const hide = useCallback(() => setCount(c => Math.max(0, c - 1)), []);
  return (
    <LoadingContext.Provider value={{ count, show, hide }}>
      {children}
    </LoadingContext.Provider>
  );
};
```

### 2. App 根组件引入 MemeLoading

```tsx
import MemeLoading from '@/components/memeLoading';
import { LoadingProvider, useGlobalLoading } from '@/store/LoadingContext';

function App() {
  const { count } = useGlobalLoading();
  return <>
    {/* ...其它内容... */}
    <MemeLoading loadingSignal={count} queueMode />
  </>;
}

// 包裹整个应用
export default function Root() {
  return (
    <LoadingProvider>
      <App />
    </LoadingProvider>
  );
}
```

### 3. 业务页面/异步任务用法

```tsx
import { useGlobalLoading } from '@/store/LoadingContext';
const { show, hide } = useGlobalLoading();

const handleAsync = async () => {
  show();
  try {
    await doSomething();
  } finally {
    hide();
  }
};
```

### 4. 非队列模式（兼容旧用法）

```tsx
<MemeLoading loadingSignal={loading} safemod />
```

## 注意事项
- 推荐全局只引入一次 MemeLoading，避免多页面重复遮罩。
- 队列模式下，所有 loading 任务都应配对 show/hide，防止遮罩泄漏。
- safemod=true 时动画极快且 minDuration=0。

---

作者：[cybermanhao](https://github.com/cybermanhao)
