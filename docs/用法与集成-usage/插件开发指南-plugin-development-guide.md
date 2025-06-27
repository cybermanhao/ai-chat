# 聊天界面插件开发指南

> **⚠️ [插件系统已禁用] 警告**
> 
> 插件系统尚未完善，暂时停止开发。本文档内容仅供参考，实际功能已禁用。
> 如需恢复插件功能，请完善插件系统实现并取消相关注释。

## 1. 插件系统概述

插件系统允许开发者通过多种方式扩展聊天界面的功能：
- XML渲染插件：自定义消息渲染
- 工具插件：提供额外功能
- 主题插件：自定义界面主题
- AI模型插件：集成新的模型

## 2. 插件类型

### 2.1 XML渲染插件

用于扩展消息的渲染能力，通过自定义 XML 标签实现。

```typescript
interface XMLPlugin {
  id: string;          // 插件唯一标识
  name: string;        // 插件名称
  description: string; // 插件描述
  version: string;     // 插件版本
  author: string;      // 插件作者
  enabled: boolean;    // 插件是否启用
  
  // XML 标签定义
  xmlTags: {
    [tagName: string]: {
      description: string;        // 标签说明
      attributes?: {             // 属性定义
        [attrName: string]: {
          type: 'string' | 'number' | 'boolean';
          required?: boolean;
          description: string;
        };
      };
      render: (props: any) => React.ReactNode; // 渲染函数
    };
  };
}
```

使用示例：
```tsx
// 代码高亮插件
export const CodeHighlightPlugin: XMLPlugin = {
  id: 'code-highlight',
  name: '代码高亮',
  version: '1.0.0',
  author: 'Your Name',
  description: '为代码添加语法高亮',
  enabled: true,
  
  xmlTags: {
    'code': {
      description: '代码块',
      attributes: {
        lang: {
          type: 'string',
          description: '编程语言',
          required: true
        }
      },
      render: ({ lang, children }) => (
        <SyntaxHighlighter language={lang}>
          {children}
        </SyntaxHighlighter>
      )
    }
  }
};
```

### 2.2 工具插件

扩展聊天功能，提供额外的工具和能力。

```typescript
interface ToolPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  
  // 工具定义
  tools: {
    [name: string]: {
      description: string;
      parameters: {
        [key: string]: {
          type: string;
          description: string;
          required?: boolean;
        };
      };
      execute: (params: any) => Promise<any>;
    };
  };
  
  // UI组件（可选）
  components?: {
    toolbar?: React.ComponentType;
    settings?: React.ComponentType;
  };
}
```

使用示例：
```typescript
// 文件处理插件
export const FileProcessorPlugin: ToolPlugin = {
  id: 'file-processor',
  name: '文件处理器',
  version: '1.0.0',
  description: '处理各种文件格式',
  
  tools: {
    readPdf: {
      description: '读取PDF文件内容',
      parameters: {
        file: {
          type: 'file',
          description: 'PDF文件',
          required: true
        }
      },
      async execute({ file }) {
        // PDF处理逻辑
      }
    }
  },
  
  components: {
    toolbar: FileUploadButton,
    settings: FileProcessorSettings
  }
};
```

### 2.3 主题插件

自定义界面主题和样式。

```typescript
interface ThemePlugin {
  id: string;
  name: string;
  version: string;
  
  // 主题定义
  theme: {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
      [key: string]: string;
    };
    typography: {
      fontFamily: string;
      fontSize: {
        small: string;
        medium: string;
        large: string;
      };
    };
    spacing: {
      small: string;
      medium: string;
      large: string;
    };
  };
  
  // 组件样式覆盖
  components?: {
    [componentName: string]: {
      styleOverrides: Record<string, any>;
    };
  };
}
```

## 3. 插件开发流程

### 3.1 创建插件

1. 在 `plugins` 目录下创建新文件：
```
src/plugins/
  ├── myPlugin/
  │   ├── index.ts
  │   ├── components/
  │   └── utils/
```

2. 实现插件接口：
```typescript
export const myPlugin: Plugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  // ... 其他配置
};
```

### 3.2 注册插件

在 `plugins/index.ts` 中注册：

```typescript
import { myPlugin } from './myPlugin';

export const plugins = [
  myPlugin,
  // ... 其他插件
];
```

### 3.3 测试插件

1. 创建测试文件：
```typescript
// __tests__/myPlugin.test.ts
describe('My Plugin', () => {
  it('should render correctly', () => {
    // 测试代码
  });
});
```

2. 运行测试：
```bash
pnpm test
```

## 4. 最佳实践

### 4.1 性能优化

- 使用 React.memo 优化渲染
- 避免不必要的状态更新
- 合理使用 useCallback 和 useMemo

### 4.2 安全性

- 验证用户输入
- 避免 XSS 漏洞
- 使用安全的依赖包

### 4.3 可维护性

- 遵循类型系统
- 编写清晰的文档
- 添加适当的注释

## 5. API参考

### 5.1 核心API

```typescript
interface PluginAPI {
  // 注册渲染器
  registerRenderer: (renderer: Renderer) => void;
  
  // 注册工具
  registerTool: (tool: Tool) => void;
  
  // 注册主题
  registerTheme: (theme: Theme) => void;
  
  // 获取应用状态
  getState: () => AppState;
  
  // 发送消息
  sendMessage: (message: Message) => void;
}
```

### 5.2 工具函数

```typescript
// 工具函数
export const pluginUtils = {
  // XML解析
  parseXML: (xml: string) => Element;
  
  // 安全的HTML渲染
  sanitizeHTML: (html: string) => string;
  
  // 样式处理
  createStyles: (styles: Styles) => string;
};
```

## 6. 调试指南

### 6.1 开发环境

1. 启动开发服务器：
```bash
pnpm dev
```

2. 开启调试模式：
```typescript
// 在插件开发时启用调试
const DEBUG_PLUGINS = true;
```

### 6.2 常见问题

1. **插件不生效**
   - 检查插件是否正确注册
   - 确认插件配置是否正确
   - 查看控制台错误信息

2. **渲染异常**
   - 检查XML标签格式
   - 确认渲染函数返回值
   - 验证样式文件是否正确加载

3. **性能问题**
   - 优化正则表达式
   - 减少不必要的DOM操作
   - 使用适当的缓存策略

## 7. 发布流程

1. 构建插件：
```bash
pnpm build:plugin
```

2. 测试构建结果：
```bash
pnpm test:plugin
```

3. 发布到插件市场：
```bash
pnpm publish:plugin
```
