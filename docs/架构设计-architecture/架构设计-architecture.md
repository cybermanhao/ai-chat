# ZZ AI Chat 架构与特性

## 项目特性

- 🚀 支持主流大语言模型 (目前已支持 Deepseek，OpenAI/Qwen/本地模型规划中)
- 🔌 强大的插件系统（渲染、工具、主题、AI 模型插件）
- 🎨 自定义主题和多语言支持
- 💻 跨平台支持 (Web, Desktop, WeChat Mini Program)
- 🛠 开发者友好的架构

## 技术架构

### 前端目录结构

```
web/
├── src/
│   ├── components/     # 公共组件
│   ├── contexts/       # React Contexts
│   ├── hooks/         # 自定义 Hooks
│   ├── pages/         # 页面组件
│   ├── plugins/       # 插件系统
│   ├── services/      # API 服务
│   ├── store/         # 状态管理
│   ├── styles/        # 全局样式
│   └── utils/         # 工具函数
```

### 状态管理

使用 [Zustand](https://github.com/pmndrs/zustand) 进行状态管理，相比 Redux 更加轻量和灵活。

示例:
```typescript
import { create } from 'zustand';

interface ChatState {
  messages: Message[];
  addMessage: (message: Message) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
}));
```

### 核心依赖

- [React](https://react.dev/) - UI 框架
- [Zustand](https://github.com/pmndrs/zustand) - 状态管理
- [React Router](https://reactrouter.com/) - 路由管理
- [Vite](https://vitejs.dev/) - 构建工具
- [TypeScript](https://www.typescriptlang.org/) - 类型系统
- [Less](https://lesscss.org/) - CSS 预处理器

### 多端支持

#### Web
标准的 Web 应用，支持所有现代浏览器。使用 Vite 构建，支持 HMR 和快速开发。

#### 桌面应用 (规划中)
基于 Electron 的桌面应用，提供更多本地功能:
- 本地模型支持
- 文件系统集成
- 系统托盘
- 离线使用

#### 微信小程序 (规划中)
原生微信小程序，提供轻量级的聊天功能:
- 基础对话
- 快捷分享
- 小程序云开发集成

## 插件系统

支持多种类型的插件:
- 渲染插件: 扩展消息渲染能力
- 工具插件: 提供额外的功能
- 主题插件: 自定义界面主题
- AI 模型插件: 集成新的模型

详细开发指南见 [插件开发指南](./plugin-development-guide.md)

## 贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](../LICENSE) 了解详情
