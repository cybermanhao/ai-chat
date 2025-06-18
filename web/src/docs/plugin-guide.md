# 插件开发指南

## 插件系统概述

插件系统允许开发者通过 XML 标签扩展和自定义 AI 助手的渲染能力。系统会处理被 `<xml>` 标签包裹且内部第一层为 `<plugin>` 标签的内容。每个插件可以：
1. 注入系统提示词，告诉 AI 如何使用插件
2. 自定义内容渲染，实现特定的 UI 效果

## 插件接口

```typescript
interface Plugin {
  id: string;          // 插件唯一标识
  name: string;        // 插件名称
  description: string; // 插件描述
  version: string;     // 插件版本
  author: string;      // 插件作者
  systemPrompt?: string;  // 注入的系统提示词
  trigger?: RegExp;    // 触发插件渲染的正则表达式
  onRender?: PluginRenderer;  // 渲染回调函数
  enabled: boolean;    // 插件是否启用
}
```

### 渲染上下文

```typescript
interface PluginRenderContext {
  content: string;  // 原始内容
  setContent: (content: string) => void;  // 设置处理后的内容
}
```

## 开发插件

### 1. 基本结构
```typescript
const myPlugin: Plugin = {
  id: 'my-plugin',
  name: '我的插件',
  description: '插件描述',
  version: '1.0.0',
  author: '作者名',
  enabled: true
};
```

### 2. 注入系统提示词
```typescript
const myPlugin: Plugin = {
  // ...基本信息
  systemPrompt: '你是一个专业的助手，特别擅长...',
};
```

### 3. 自定义渲染
```typescript
const myPlugin: Plugin = {
  // ...基本信息
  trigger: /\<custom\>.*?\<\/custom\>/g,  // 匹配需要处理的内容
  onRender: async ({ content, setContent }) => {
    // 处理内容
    const processed = content.replace(
      /\<custom\>(.*?)\<\/custom\>/g,
      (_, text) => `<div class="custom">${text}</div>`
    );
    setContent(processed);
  }
};
```

## 最佳实践

1. **性能优化**
   - 使用精确的触发条件
   - 避免不必要的内容处理
   - 优化正则表达式

2. **错误处理**
   - 处理所有可能的异常情况
   - 提供合适的回退方案

3. **可维护性**
   - 使用清晰的命名
   - 添加详细的文档
   - 遵循类型定义

## 示例：XML标签渲染插件

这个插件用于检测和渲染XML格式的自定义标签：

```typescript
import type { Plugin } from '@/types/plugin';

export const xmlRendererPlugin: Plugin = {
  id: 'xml-renderer',
  name: 'XML渲染器',
  description: '将XML格式的标签转换为美观的UI组件',
  version: '1.0.0',
  author: 'ChatAI',
  
  // 注入系统提示词，告诉AI如何使用XML标签
  systemPrompt: \`你可以使用以下XML标签来增强回答的表现力：
  - <highlight>重要内容</highlight>
  - <note>补充说明</note>
  - <warning>警告信息</warning>
  请在合适的场景使用这些标签。\`,
  
  // 匹配XML标签
  trigger: /<(highlight|note|warning)>[\s\S]*?<\/\1>/g,
  
  // 渲染处理
  onRender: async ({ content, setContent }) => {
    const processed = content
      .replace(
        /<highlight>([\s\S]*?)<\/highlight>/g,
        '<div class="xml-highlight">$1</div>'
      )
      .replace(
        /<note>([\s\S]*?)<\/note>/g,
        '<div class="xml-note">$1</div>'
      )
      .replace(
        /<warning>([\s\S]*?)<\/warning>/g,
        '<div class="xml-warning">$1</div>'
      );
      
    setContent(processed);
  },
  
  enabled: true,
};
```

使用这个插件：

```typescript
import { usePluginStore } from '@/store/pluginStore';
import { xmlRendererPlugin } from './plugins/xml-renderer';

// 注册插件
const { addPlugin } = usePluginStore();
addPlugin(xmlRendererPlugin);
```

添加样式：

```less
.xml-highlight {
  padding: 8px 12px;
  margin: 8px 0;
  background: rgba(var(--primary-rgb), 0.1);
  border-left: 4px solid var(--primary-color);
  border-radius: 4px;
}

.xml-note {
  padding: 8px 12px;
  margin: 8px 0;
  background: rgba(var(--info-rgb), 0.1);
  border-left: 4px solid var(--info-color);
  border-radius: 4px;
}

.xml-warning {
  padding: 8px 12px;
  margin: 8px 0;
  background: rgba(var(--warning-rgb), 0.1);
  border-left: 4px solid var(--warning-color);
  border-radius: 4px;
}
```

效果示例：

当 AI 回答包含：
```xml
<xml>
  <plugin name="xml-renderer">
    <highlight>这是一个重要提示</highlight>
    <note>这是补充说明</note>
    <warning>这是警告信息</warning>
  </plugin>
</xml>
```

将被渲染为带有样式的 UI 组件，提供更好的视觉体验。
