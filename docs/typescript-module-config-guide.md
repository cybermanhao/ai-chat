# TypeScript 和 Vite 模块配置指南

## 目录
1. [模块系统概述](#模块系统概述)
2. [模块格式对比](#模块格式对比)
3. [TypeScript 配置详解](#typescript-配置详解)
4. [Vite 配置最佳实践](#vite-配置最佳实践)
5. [常见问题与解决方案](#常见问题与解决方案)

## 模块系统概述

### JavaScript 模块发展历程
- **早期**: 无模块系统，使用全局变量和命名空间
- **CommonJS**: Node.js 采用的模块系统 (require/module.exports)
- **AMD**: 浏览器异步模块定义
- **UMD**: 通用模块定义，兼容 CommonJS 和 AMD
- **ES Modules**: 现代 JavaScript 标准模块系统 (import/export)

## 模块格式对比

### .js vs .mjs vs .cjs
- **.js**: 
  - 在 package.json 中 `"type": "module"` 时默认为 ESM
  - 在 package.json 中 `"type": "commonjs"` 或未指定时默认为 CommonJS
  
- **.mjs**:
  - 强制使用 ES Modules
  - 始终使用 import/export
  - 不受 package.json 的 "type" 字段影响
  
- **.cjs**:
  - 强制使用 CommonJS
  - 始终使用 require/module.exports
  - 不受 package.json 的 "type" 字段影响

### 模块导入/导出语法对比

> ⚠️ 注意：以下示例包含一些不推荐在实际项目中使用的语法。这些示例的目的是帮助理解 TypeScript 的模块系统工作原理，而不是最佳实践。

```javascript
// CommonJS
const module = require('./module');
module.exports = { ... };

// ES Modules
import module from './module';
export default { ... };

// 混合使用（仅用于理解原理，实际项目中应避免）
import cjsModule = require('./commonjs-module');
export = { ... }; // TypeScript 特有语法，现代项目应使用 ES Modules 导出
```

在实际项目中，我们应该：
- 统一使用 ES Modules 语法
- 避免混合使用不同的模块系统
- 使用 TypeScript 的 `esModuleInterop` 来处理与 CommonJS 模块的互操作

## TypeScript 配置详解

### 模块解析机制详解

#### 解析策略
TypeScript 提供了两种主要的模块解析策略：
- **Node**: Node.js 风格解析，适用于 CommonJS/ES Modules
- **NodeNext**: 更现代的 Node.js 解析策略，支持 package.json "exports"
- **Bundler**: 适用于 Vite/webpack 等打包工具的解析策略

```json
{
  "compilerOptions": {
    "moduleResolution": "Bundler",    // 或 "Node"/"NodeNext"
  }
}
```

#### 模块解析流程
1. **相对路径导入**
   ```typescript
   import { foo } from "./moduleA";
   // 解析顺序：
   // 1. ./moduleA.ts
   // 2. ./moduleA.tsx
   // 3. ./moduleA.d.ts
   // 4. ./moduleA/index.ts
   ```

2. **绝对路径导入**
   ```typescript
   import { bar } from "@/utils";
   // 解析顺序：
   // 1. <baseUrl>/@/utils.ts
   // 2. <paths映射的位置>/utils.ts
   // 3. node_modules/@/utils
   ```

### 源码和构建目录配置

#### 核心配置项
- **rootDir**: 源码的根目录
- **outDir**: 编译输出目录
- **baseUrl**: 非相对导入的基准目录
- **paths**: 路径别名映射

```json
{
  "compilerOptions": {
    "rootDir": "src",          // 所有源文件必须在此目录下
    "outDir": "dist",          // 编译后的文件将输出到这个目录
    "baseUrl": ".",           // 非相对导入的基准目录
    "paths": {                // 路径别名配置
      "@/*": ["src/*"],      // 将 @/ 映射到 src/ 目录
      "@common/*": ["../common/src/*"]  // 跨项目引用
    }
  }
}
```

#### 构建输出结构
- rootDir/outDir 配置决定了源码到构建目录的映射关系
- 源码目录结构会被保留在输出目录中
```
src/
  ├── models/
  │   └── user.ts
  └── utils/
      └── format.ts
```
编译后：
```
dist/
  ├── models/
  │   └── user.js
  └── utils/
      └── format.js
```

#### 最佳实践
1. **避免引用 dist 目录**
   - 使用 paths 配置别名，引用源码目录
   - 在 tsconfig.json 中排除 dist 目录：
   ```json
   {
     "exclude": ["**/dist", "**/node_modules"]
   }
   ```

2. **正确使用项目引用**
   - 启用 composite 和 declaration
   - 配置准确的 rootDir/outDir
   ```json
   {
     "compilerOptions": {
       "composite": true,
       "declaration": true,
       "rootDir": "src",
       "outDir": "dist"
     }
   }
   ```

3. **处理跨项目依赖**
   - 使用 paths 映射依赖项源码
   - 配置 references 指向依赖项
   ```json
   {
     "references": [
       { "path": "../common" }
     ],
     "compilerOptions": {
       "paths": {
         "@common/*": ["../common/src/*"]
       }
     }
   }
   ```

### tsconfig.json 核心配置项

#### 模块相关
```json
{
  "compilerOptions": {
    "module": "ES2022",        // 输出的模块系统
    "moduleResolution": "Node", // 模块解析策略
    "esModuleInterop": true,   // 启用 ES 模块互操作性
    "allowJs": true,           // 允许编译 JavaScript 文件
    "checkJs": true,           // 对 JavaScript 文件进行类型检查
  }
}
```

#### 路径和目录配置
```json
{
  "compilerOptions": {
    "baseUrl": ".",           // 非相对模块导入的基准目录
    "rootDir": "src",         // 源代码的根目录
    "outDir": "dist",         // 输出目录
    "paths": {               // 路径映射，类似于别名
      "@/*": ["src/*"]
    }
  }
}
```

#### 项目引用配置
```json
{
  "references": [
    { "path": "../common" },    // 引用其他 TypeScript 项目
    { "path": "../feature" }
  ],
  "compilerOptions": {
    "composite": true,          // 启用项目引用功能
    "declaration": true,        // 生成声明文件
    "declarationMap": true      // 生成声明文件的 source map
  }
}
```

## Vite 配置最佳实践

### vite.config.ts 基础配置
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  // 开发服务器配置
  server: {
    port: 3000
  },
  
  // 构建配置
  build: {
    target: 'es2020',
    outDir: 'dist',
    rollupOptions: {
      // 外部化依赖
      external: ['react', 'react-dom']
    }
  },
  
  // 解析配置
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
```

### 处理不同模块类型
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // 根据不同环境输出不同格式
        format: process.env.FORMAT || 'es'
      }
    }
  },
  
  // 优化依赖预构建
  optimizeDeps: {
    // 强制预构建这些依赖
    include: ['lodash-es'],
    // 排除不需要预构建的依赖
    exclude: ['your-local-package']
  }
});
```

## 常见问题与解决方案

### 1. ES Modules 和 CommonJS 混用问题

#### 问题描述
在同一个项目中混合使用 ES Modules 和 CommonJS 模块。

#### 解决方案
```json
// package.json
{
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### 2. 项目引用和路径解析

#### 问题描述
在 monorepo 中，不同项目之间的相互引用和路径解析问题。

#### 解决方案
```json
// root/tsconfig.json
{
  "references": [
    { "path": "packages/common" },
    { "path": "packages/feature" }
  ],
  "files": []  // 空文件列表表示这是一个解决方案文件
}
```

```json
// packages/feature/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": "src",
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@common/*": ["../common/src/*"]
    }
  },
  "references": [
    { "path": "../common" }
  ]
}
```

### 3. TypeScript 和 Vite 的类型检查

#### 问题描述
Vite 默认不执行类型检查，需要配置额外的类型检查步骤。

#### 解决方案
```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "typecheck": "tsc --noEmit"
  }
}
```

## 最佳实践建议

1. **明确模块策略**
   - 优先使用 ES Modules
   - 在 package.json 中明确声明 "type": "module"
   - 对遗留代码使用 .cjs 扩展名

2. **项目结构**
   - 使用 src 作为源代码根目录
   - 使用 dist 作为输出目录
   - 将类型定义放在 types 目录

3. **路径配置**
   - 使用 baseUrl 和 paths 配置别名
   - 避免使用相对路径的 "../../../"

4. **构建优化**
   - 使用项目引用进行增量构建
   - 配置适当的 external 依赖
   - 使用 optimizeDeps 优化开发体验
