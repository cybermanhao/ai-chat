# 使用 Immer 编写 Reducer（中文翻译）

Redux Toolkit 的 createReducer 和 createSlice 内部自动使用 Immer，让你可以用"可变"语法编写不可变更新逻辑，大大简化了 reducer 的实现。

## 不可变性与 Redux

### 不可变性的基础

"Mutable" 意味着"可变"。如果某物是"immutable"，它就永远不能被更改。

JavaScript 的对象和数组默认都是可变的。例如：

```js
const obj = { a: 1, b: 2 }
obj.b = 3 // 内容被改变

const arr = ['a', 'b']
arr.push('c')
arr[1] = 'd'
```

这叫做"变异"对象或数组。引用没变，但内容变了。

要实现不可变更新，必须复制原有对象/数组，然后修改副本：

```js
const obj2 = {
  ...obj,
  a: {
    ...obj.a,
    c: 42,
  },
}
const arr2 = arr.concat('c')
const arr3 = arr.slice(); arr3.push('c')
```

更多可参考：
- [A Visual Guide to References in JavaScript](https://daveceddia.com/javascript-references/)
- [Immutability in React and Redux: The Complete Guide](https://daveceddia.com/react-redux-immutability-guide/)

### Reducer 与不可变更新

Redux 的核心规则之一：reducer 绝不能直接变异原始 state！

```js
// ❌ 错误：直接变异 state
state.value = 123
```

原因：
- 会导致 UI 不更新
- 难以追踪和测试
- 破坏时间旅行调试
- 违背 Redux 设计理念

正确做法：
```js
// ✅ 正确：返回新副本
return { ...state, value: 123 }
```

嵌套数据时，手写不可变更新很繁琐：
```js
function handwrittenReducer(state, action) {
  return {
    ...state,
    first: {
      ...state.first,
      second: {
        ...state.first.second,
        [action.someId]: {
          ...state.first.second[action.someId],
          fourth: action.someValue,
        },
      },
    },
  }
}
```

手写不可变更新很难，容易出错。

## 使用 Immer 实现不可变更新

Immer 提供了 `produce` 函数，允许你在"草稿"上用可变写法，Immer 会自动生成不可变的新对象：

```js
import { produce } from 'immer'

const baseState = [
  { todo: 'Learn typescript', done: true },
  { todo: 'Try immer', done: false },
]

const nextState = produce(baseState, (draft) => {
  draft.push({ todo: 'Tweet about it' })
  draft[1].done = true
})
```

## Redux Toolkit 与 Immer

Redux Toolkit 的 createReducer、createSlice 内部自动用 Immer 包裹，所以你可以直接用"可变"写法：

```js
const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    todoAdded(state, action) {
      state.push(action.payload)
    },
  },
})
```

即使 case reducer 单独定义也可以：
```js
const addItemToArray = (state, action) => {
  state.push(action.payload)
}
```

**注意：只有在 Immer 包裹下，"可变"写法才安全！**

## Immer 使用模式与注意事项

- 只能"变异" draft 或返回新对象，不能两者同时。
- 不能在箭头函数隐式 return 里变异 state。
- 可以用 Object.assign 批量变异字段。
- 替换整个 state 必须 return 新对象，不能直接赋值 state = ...。
- 日志调试 draft 时用 `import { current } from '@reduxjs/toolkit'`。
- 嵌套对象/数组也会被 Proxy 包裹，可以安全变异。
- Immer 不会自动创建嵌套对象/数组，需要手动初始化。

## 为什么 Redux Toolkit 强制集成 Immer？

- 极大简化 reducer 代码，消除嵌套展开、易读易维护。
- 防止意外变异，自动 freeze，开发期直接报错。
- 性能损耗极小，远小于 UI 更新成本。
- 只需关注业务逻辑，不用担心不可变细节。

## 参考资料
- [Immer 官方文档](https://immerjs.github.io/immer/)
- [Redux Toolkit 官方文档：Writing Reducers with Immer](https://redux-toolkit.js.org/usage/immer-reducers) 