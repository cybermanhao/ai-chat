# 聊天界面插件开发指南

## 插件系统概述
插件系统允许开发者通过自定义 XML 标签来扩展聊天界面的渲染能力。每个插件需要先用 `<plugin>` 标签声明，然后可以在声明的范围内使用自己的 XML 标签和渲染逻辑。这种设计确保了插件之间的隔离，并使得系统能够精确知道每段内容应该由哪个插件来处理。

## XML 插件规范

### 插件定义
```typescript
interface Plugin {
  id: string;          // 插件唯一标识
  name: string;        // 插件名称
  description: string; // 插件描述
  version: string;     // 插件版本
  author: string;      // 插件作者
  enabled: boolean;    // 插件是否启用
  
  // XML 标签定义
  xmlTags: {
    [tagName: string]: {
      description: string;       // 标签说明
      allowedAttributes?: string[];  // 允许的属性列表
      render: (content: string, attributes: Record<string, string>) => string;  // 渲染函数
    }
  };
  
  // 插件的系统提示词，用于告诉 AI 如何使用这个插件的标签
  systemPrompt?: string;
}
```

### 示例：Button 插件
以下是一个示例插件，它实现了一个可点击按钮的渲染：

```typescript
const buttonPlugin: Plugin = {
  id: 'button-renderer',
  name: '按钮渲染器',
  description: '将 XML 标签渲染为可交互的按钮组件',
  version: '1.0.0',
  author: 'Example',
  enabled: true,

  xmlTags: {
    'button': {
      description: '渲染一个按钮',
      allowedAttributes: ['type', 'size'],
      render: (content, attrs) => {
        const type = attrs.type || 'default';
        const size = attrs.size || 'middle';
        return `<button class="ant-btn ant-btn-${type} ant-btn-${size}">${content}</button>`;
      }
    }
  },

  systemPrompt: `你可以使用 <button> 标签来渲染按钮：
  
基础用法：
<button>点击我</button>

带属性的用法：
<button type="primary" size="large">主要按钮</button>

支持的属性：
- type: default | primary | dashed | text | link
- size: small | middle | large`
};
```

### XML 格式规范

要使用插件功能，内容必须先用 `<xml>` 标签包裹，并且其中第一层内容必须是 `<plugin>` 标签：

```xml
<xml>
  <plugin name="插件ID">
    实际内容...
  </plugin>
</xml>
```

系统只会处理被 `<xml>` 标签包裹的内容，而且只有当 `<xml>` 标签内第一层是 `<plugin>` 标签时，才会进行插件渲染处理。这样设计可以让系统明确知道哪些内容需要进行插件处理。

### 使用示例

在对话中，你可以这样使用这个按钮插件：

\`\`\`
AI: 让我展示一下按钮插件的功能：

<xml>
  <plugin name="button-renderer">
    这是一些按钮示例：
    <button type="primary">确认操作</button>
    <button type="dashed">取消操作</button>

    不同尺寸的按钮：
    <button type="primary" size="large">大按钮</button>
    <button size="small">小按钮</button>
  </plugin>
</xml>
\`\`\`

注意事项：
1. 必须先使用 `<plugin>` 标签声明要使用的插件
2. 一个回答中可以使用多个不同的插件，每个插件的内容都需要用 `<plugin>` 标签包裹
3. 插件的 name 属性必须匹配已安装插件的 ID

## 实现原理

1. 插件注册时，系统会收集所有插件的定义
2. 在渲染聊天消息时，系统会：
   - 首先查找并解析 `<plugin name="xxx">` 标签来确定使用的插件
   - 将插件标签内的内容交给对应的插件处理
   - 插件使用正则表达式匹配自己定义的 XML 标签
   - 解析标签的属性和内容
   - 调用渲染函数生成 HTML
   - 用渲染结果替换原始的 XML 标签
3. 每个 `<plugin>` 标签的内容都是相互独立的处理空间

## 注意事项

1. XML 标签名称必须是唯一的，不能和其他插件冲突
2. 渲染函数应该返回有效的 HTML 字符串
3. 为了安全起见，要注意对内容和属性进行适当的转义
4. 复杂的交互逻辑需要通过全局事件系统来实现
