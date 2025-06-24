# engine 目录迁移与多端同构实践说明

本项目已将 web 端可复用的类型、工具、协议、核心 store、service、hooks 等纯逻辑代码迁移到 engine 目录，实现了 web、api、miniprogram、electron、iframe 等多端同构和类型/工具/状态共享。engine 目录已通过全部测试，web 端已最大化复用 engine 代码并持续修复构建、类型、依赖等问题。以下为最新迁移思路、配置、常见问题与多端最佳实践总结：

---

## 1. 迁移原则与目录结构

- **engine/** 只放类型、协议、工具、核心业务逻辑、store、service、纯逻辑 hooks（无 UI/框架依赖，已最大化迁移）。
- **web/** 只保留 UI 组件、UI hooks、页面、样式、UI 相关渲染器。
- 迁移内容包括：
  - types/：所有通用类型定义
  - utils/：无 UI 依赖工具函数
  - store/：所有纯逻辑 store（如 chatStore、llmConfigStore、modelConfigStore、roleStore、pluginStore、themeStore、mcpStore、chatRuntimeStore 等）
  - service/：与 UI 无关的核心服务（如 chatStorage、llmService）
  - hooks/：所有纯逻辑 hooks（如 useChatMessages、useLLMConfig、useModelConfig、useChatList 等）
- web 端如需新 store、service、hooks，优先在 engine 实现，web 仅做绑定和 UI 适配。

## 2. 导入与路径配置

- web 端通过 tsconfig 路径别名 @engine/* 直接 import engine 代码。
- engine 目录下所有 import 路径均为相对路径（../types/xxx、../utils/xxx 等）。
- web 端 UI 组件/页面/渲染器/上下文等只 import @engine/ 下的纯逻辑，不反向依赖 web/ 目录。
- 如遇路径问题优先修正 tsconfig。

## 3. Store/Hook 多端同构与 zustand-pub 实践

- engine/store/ 下所有 store 仅导出 storeDefinition 工厂函数，不直接依赖 zustand/react。
- 各端可用 zustand、zustand-pub、zustand-vue 等绑定 engine 层 storeDefinition，实现多端状态共享。
- 推荐 web 端用 zustand-pub 绑定（支持 iframe/微前端/多应用状态同步）：

```ts
import PubStore from 'zustand-pub';
import create from 'zustand';
import { chatStoreDefinition } from '@engine/store/chatStore';

const pubStore = new PubStore('chat');
const store = pubStore.defineStore('chat', chatStoreDefinition);
export const useChatStore = create(store);
```

- 其它端（如 electron、miniprogram）可用 zustand-pub/zustand-vue 等同理绑定。
- web 端如需专属 UI 状态，可单独在 web/store 下实现。

## 4. 构建与测试

- engine/ 目录独立 tsconfig.json，支持独立构建（tsc -b engine）。
- web 构建前需确保 engine 已构建通过。
- engine/tests/ 只保留依赖 engine/types、engine/utils、engine/store、engine/service 的纯逻辑单元测试。
- web/src/tests/ 只保留 UI/集成测试，必要时可补充 web 层与 engine 结合的集成测试。
- package.json 增加 test:engine 脚本，支持 engine 端测试。

## 5. 常见迁移修复点

- 类型导出需完整、无命名冲突，所有类型文件需加 `export {}` 保证为模块。
- storeDefinition 工厂参数需加类型注解，避免隐式 any。
- 工具函数、类型、store、service、hooks 迁移后，web 端需统一改为 @engine/ 路径导入。
- 依赖如 uuid、openai 等需在 engine/package.json 或根目录 package.json 安装。
- UI 相关逻辑、组件、上下文、渲染器等严禁迁移到 engine。
- web 端如遇类型、store、service 缺失，优先查找 engine 并补充迁移。
- 遇到构建/类型/依赖问题，优先检查 engine 导出、路径、依赖声明。

## 6. 多端同构最佳实践

- 任何与 UI/框架无关的类型、工具、协议、store、service、hooks，优先迁移到 engine。
- 各端只需绑定/适配 UI 层，业务逻辑与状态管理全部共用 engine 代码。
- 跨端状态共享推荐用 zustand-pub，支持 iframe、微前端、模块联邦等场景。
- 迁移后如遇类型、依赖、构建、测试等问题，优先检查导出、路径、依赖、类型声明。
- web 端如需新功能，先在 engine 实现纯逻辑，再在 web 绑定 UI。

---

如需自动迁移、修复、适配其它多端逻辑，或遇到具体问题，可参考本说明或联系维护者。
