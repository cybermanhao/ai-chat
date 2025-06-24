# Zustand 中文最佳实践与进阶用法总结

本总结基于 `docs/zustand/docs/guides/typescript.md`、`updating-state.md`、`testing.md`、`middlewares/persist.md`、`middlewares/combine.md` 及 examples/starter/README.md 等文档，归纳了在实际项目中使用 Zustand（含 TypeScript 场景）的核心要点与进阶技巧。

---

## 1. TypeScript 使用要点

- **类型声明推荐**：Zustand 推荐 `create<T>()(...)` 这种柯里化写法，T 为状态类型。这样能获得最佳类型推断和类型安全。
- **类型推断局限**：由于 TypeScript 泛型推断的协变/逆变问题，Zustand 不能自动推断 state 类型，需手动声明。
- **combine 用法**：`combine` 中初始 state 可自动推断类型，无需手动声明，适合简单场景。
- **ExtractState 工具**：可用 `ExtractState<typeof useStore>` 提取 store 类型，便于类型复用。

## 2. 状态更新与嵌套对象

- **浅合并**：Zustand 默认 set 时为浅合并，适合扁平结构。
- **深层嵌套**：深层对象需手动展开（...），或结合 immer、optics-ts、ramda 等库实现更优雅的深度更新。
- **immer 集成**：推荐用 immer 中间件简化深层状态变更。

## 3. 持久化（persist）最佳实践

- **基本用法**：通过 persist 中间件可将 store 状态持久化到 localStorage、sessionStorage 或自定义存储。
- **部分持久化**：可用 partialize 选项只持久化部分 state，提升性能与安全。
- **自定义存储**：支持自定义 storage（如 URL、IndexedDB 等），只需实现 getItem/setItem/removeItem。
- **版本迁移**：支持 version + migrate 选项，便于 schema 变更时平滑升级。
- **深合并**：可用 merge 选项自定义持久化数据与当前 state 的合并逻辑（如 deepmerge）。
- **手动 hydrate**：skipHydration + persist.rehydrate() 可实现 SSR 场景下的手动数据恢复。

## 4. combine 中间件

- **类型自动推断**：combine 可自动推断初始 state 和 actions，无需显式类型声明。
- **用法简洁**：适合小型 store 或 slices 场景，提升开发效率。

## 5. 自动化测试

- **store 重置**：测试时可通过 mock zustand 的 create/createStore，自动收集并重置所有 store，保证测试隔离。
- **React 组件测试**：推荐结合 React Testing Library（RTL）进行组件测试，模拟用户行为。
- **store 逻辑测试**：可直接调用 useStore.getState/setState 进行断言。
- **Context 场景**：支持 createStore + Context + useStoreWithEqualityFn 实现多实例 store 测试。
- **Jest/Vitest 支持**：官方文档有详细的 Jest/Vitest 配置与 mock 方案。

## 6. 其它进阶用法

- **中间件链式组合**：devtools、persist、immer 等中间件可链式组合，推荐 devtools 放最后，避免类型丢失。
- **自定义中间件**：可通过 StateCreator 泛型和 StoreMutatorIdentifier 实现类型安全的自定义中间件。
- **Slices 模式**：推荐用 slices 拆分大型 store，提升可维护性。
- **vanilla store 绑定**：可用 createStore + useStore 实现“无 React 依赖”的 store，便于多端复用。

---

## 7. 推荐实践小结

1. 业务 store 推荐 engine 层只导出纯逻辑 storeDefinition，web 层用 create 绑定。
2. 持久化只在必要时做，优先用 partialize 精细控制，避免性能浪费。
3. 复杂嵌套对象优先用 immer 简化代码。
4. 自动化测试时注意 store 隔离与重置。
5. 充分利用 combine、slices、vanilla store 等进阶能力，提升架构灵活性。

---

> 本文档为 zz-ai-chat 项目 Zustand 相关最佳实践与进阶用法总结，建议结合 chat-flow.md、multi-platform-architecture.md 等文档一同阅读。
