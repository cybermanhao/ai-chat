// ========================================
// [插件系统已禁用] - 插件系统尚未完善，暂时停止开发
// 本文件保留插件定义和实现，但注释掉插件导出
// 如需恢复插件功能，请取消相关注释并完善插件系统实现
// ========================================

// [插件系统已禁用] - 注释掉插件类型导入
// import type { Plugin } from '@/types/plugin';

// [插件系统已禁用] - 保留插件定义，但注释掉导出
/*
export const buttonPlugin: Plugin = {
  id: 'button-renderer',
  name: '按钮渲染器',
  description: '将 XML 标签渲染为可交互的按钮组件',  version: '1.0.0',
  author: 'HAO',
  enabled: true,

  config: {
    enabled: true,
    defaultType: 'default',
    defaultSize: 'middle'
  },

  configSchema: {
    type: 'object',
    properties: {
      enabled: {
        type: 'boolean',
        description: '是否启用插件',
        default: true
      },
      defaultType: {
        type: 'string',
        description: '默认按钮类型',
        default: 'default'
      },
      defaultSize: {
        type: 'string',
        description: '默认按钮大小',
        default: 'middle'
      }
    }
  },

  xmlTags: {
    'button': {
      description: '渲染一个按钮',
      allowedAttributes: ['type', 'size'],      render: (content, attrs) => {
        const type = attrs.type || 'default';
        const size = attrs.size || 'middle';
        return `<button class="xml-button ${type} ${size}">${content}</button>`;
      }
    }
  },

  systemPrompt: `你可以使用 <button> 标签来渲染按钮：
  
基础用法：
<plugin name="button-renderer">
  <button>点击我</button>
</plugin>

带属性的用法：
<plugin name="button-renderer">
  <button type="primary" size="large">主要按钮</button>
</plugin>

支持的属性：
- type: default | primary | dashed | text | link
- size: small | middle | large`
};
*/

// [插件系统已禁用] - 导出空对象，防止其他模块引用出错
export const buttonPlugin: any = {};
