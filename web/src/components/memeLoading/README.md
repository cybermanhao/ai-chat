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
| loadingSignal    | boolean      | 是否显示 loading 遮罩                                         |
| trueFan          | boolean      | 彩蛋模式，true 时固定显示第 29 条 meme                        |
| memes            | string[]     | 可自定义 meme 列表，默认内置 defaultMemesSet                 |
| backgroundColor  | string       | 遮罩背景色                                                   |
| minDuration      | number       | 最短显示时间（秒），safemod=true 时强制为 0.1                |
| safemod          | boolean      | 安全模式，true 时不显示字符且所有动画加速为 0.1 秒           |
| boostDuration    | number       | boot 阶段加速时间（秒），safemod=true 时强制为 0.1           |

## 进阶
- 支持 TypeScript 智能提示，所有 props 均有注释说明。
- 可通过 `defaultMemesSet` 快速自定义弹幕内容。
- safemod=true 时，所有动画极限加速且不显示字符。

---

作者：[cybermanhao](https://github.com/cybermanhao)
