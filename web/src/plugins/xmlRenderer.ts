import type { Plugin } from '@/types/plugin';

const XML_TAGS = {
  highlight: {
    className: 'xml-highlight',
    style: { backgroundColor: '#fff3cd', padding: '0.2em 0.4em', borderRadius: '0.2em' }
  },
  note: {
    className: 'xml-note',
    style: { backgroundColor: '#e2e3e5', padding: '0.2em 0.4em', borderRadius: '0.2em' }
  },
  warning: {
    className: 'xml-warning',
    style: { backgroundColor: '#f8d7da', padding: '0.2em 0.4em', borderRadius: '0.2em' }
  }
};

export const xmlRendererPlugin: Plugin = {
  id: 'xml-renderer',
  name: 'XML 渲染器',
  description: '将 XML 格式的标签转换为美观的 UI 组件',
  version: '1.0.0',
  author: 'Default',
  enabled: true,

  xmlTags: {
    highlight: {
      description: '高亮显示重要内容',
      allowedAttributes: [],
      render: (content) => {
        const tag = XML_TAGS.highlight;
        const style = Object.entries(tag.style)
          .map(([key, value]) => `${key}:${value}`)
          .join(';');
        return `<span class="${tag.className}" style="${style}">${content}</span>`;
      }
    },
    note: {
      description: '显示补充说明',
      allowedAttributes: [],
      render: (content) => {
        const tag = XML_TAGS.note;
        const style = Object.entries(tag.style)
          .map(([key, value]) => `${key}:${value}`)
          .join(';');
        return `<span class="${tag.className}" style="${style}">${content}</span>`;
      }
    },
    warning: {
      description: '显示警告信息',
      allowedAttributes: [],
      render: (content) => {
        const tag = XML_TAGS.warning;
        const style = Object.entries(tag.style)
          .map(([key, value]) => `${key}:${value}`)
          .join(';');
        return `<span class="${tag.className}" style="${style}">${content}</span>`;
      }
    }
  },

  systemPrompt: `你可以使用以下XML标签来增强回答的表现力：
  
基础用法：
<plugin name="xml-renderer">
  <highlight>重要内容</highlight>
  <note>补充说明</note>
  <warning>警告信息</warning>
</plugin>

每个标签的用途：
- highlight：用于高亮显示重要的内容或关键点
- note：用于显示补充说明或附加信息
- warning：用于显示警告信息或需要特别注意的内容

请在合适的场景使用这些标签来提升回答的可读性。`
};
