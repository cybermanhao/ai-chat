# LLM 配置重构总结

## 重构概述

本次重构将 LLM 配置相关的逻辑统一迁移到 `engine/utils/llmConfig.ts`，实现了配置的"单一真源"原则，并让 `buildLLMRequestPayload` 函数重新发挥作用。

## 重构内容

### 1. 文件结构优化

#### 迁移前：
```
web/src/utils/llmConfig.ts          # 旧的配置工具函数
web/src/store/llmConfigSlice.ts     # Redux slice，直接使用 llms[0]
```

#### 迁移后：
```
engine/utils/llmConfig.ts           # 统一的配置工具函数
web/src/store/llmConfigSlice.ts     # Redux slice，使用 defaultLLMConfig
```

### 2. 核心功能

#### `engine/utils/llmConfig.ts` 提供：

1. **LLMConfig 接口**：统一的配置类型定义
2. **defaultLLMConfig**：默认配置模板
3. **buildLLMRequestPayload**：构建标准 LLM API 请求
4. **buildLLMConfigFromStore**：从 Redux store 状态构建配置

#### 配置优先级：
```
extraOptions > server.llmConfig > defaultLLMConfig
```

### 3. 使用方式

#### 在 streamManager.ts 中：
```typescript
const payload = buildLLMRequestPayload(fullMessages, {
  server: activeServer ? { 
    tools: activeServer.tools, 
    llmConfig: { /* 服务端配置 */ }
  } : undefined,
  extraOptions: { /* UI 配置，优先级最高 */ }
});
```

#### 在 llmConfigSlice.ts 中：
```typescript
import { defaultLLMConfig } from '@engine/utils/llmConfig';

const initialState: LLMConfigState = {
  activeLLMId: defaultLLM.id,
  apiKey: '',
  userModel: defaultLLM.userModel || defaultLLMConfig.model,
};
```

## 架构优势

### 1. 单一真源
- 所有配置逻辑集中在 `engine/utils/llmConfig.ts`
- 避免配置分散和重复定义

### 2. 类型安全
- 统一的 `LLMConfig` 接口
- 完整的 TypeScript 支持

### 3. 灵活性
- 支持多级配置优先级
- 兼容不同的配置来源（UI、服务端、默认值）

### 4. 可维护性
- 配置逻辑集中，易于修改和扩展
- 清晰的职责分离

## 配置流程

### 1. 初始化阶段
```typescript
// llmConfigSlice.ts
const initialState = {
  activeLLMId: defaultLLM.id,
  apiKey: '',
  userModel: defaultLLM.userModel || defaultLLMConfig.model,
};
```

### 2. 请求构建阶段
```typescript
// streamManager.ts
const payload = buildLLMRequestPayload(messages, {
  server: { tools, llmConfig },
  extraOptions: { /* UI 配置 */ }
});
```

### 3. 服务调用阶段
```typescript
// llmService.ts
const stream = await llmService.generate(payload, abortSignal);
```

## 总结

本次重构成功实现了：

- ✅ **配置统一**：所有配置逻辑集中在 engine/utils/llmConfig.ts
- ✅ **函数复用**：buildLLMRequestPayload 重新发挥作用
- ✅ **类型安全**：统一的 LLMConfig 接口
- ✅ **优先级清晰**：UI 配置 > 服务端配置 > 默认配置
- ✅ **职责分离**：配置构建与状态管理分离

现在 LLM 配置系统更加清晰、可维护，完全符合现代 Redux + engine/utils 架构的最佳实践。 