# engine 端测试运行说明

本目录下的测试仅针对 engine/types、engine/utils、engine/service 等无 UI 依赖的纯 TypeScript 逻辑。

- 推荐使用 vitest 作为测试运行器。
- 如需在 web 端测试 UI 组件、hooks、store，请在 web/src/tests/ 目录下编写。

示例命令：

```sh
pnpm dlx vitest run engine/tests
```

如需自动生成 vitest 配置或迁移更多测试，请告知。
