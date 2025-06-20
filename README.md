# ZZ AI Chat

一个现代化的 AI 聊天应用，支持多模态输入、多种大语言模型、插件系统和跨平台部署。

## 支持的大模型/服务商

| 名称         | 类型         | 状态     | 备注                |
| ------------ | ------------ | -------- | ------------------- |
| Deepseek     | 云端/官方API | ✅ 已支持 | 流式/推理内容支持   |
| OpenAI GPT   | 云端/官方API | 🚧 规划中 | 计划支持            |
| Qwen         | 云端/官方API | 🚧 规划中 | 计划支持            |
| 本地模型      | 本地         | 🚧 规划中 | 计划支持            |
| 其他          | -            | 🚧 规划中 | 欢迎贡献            |

## 特性

- 🚀 支持主流大语言模型 (暂时只有deepseek)
- 🔌 强大的插件系统
- 🎨 自定义主题和多语言支持
- 💻 跨平台支持 (Web, Desktop, WeChat Mini Program)
- 🛠 开发者友好的架构

## 快速开始

### 环境要求

- Node.js 18+
- Python 3.10+
- pnpm 8+

### 安装

```powershell
# 克隆项目
git clone https://github.com/yourusername/zz-ai-chat.git
cd zz-ai-chat

# 安装前端依赖
cd web
pnpm install

# 安装 Python 后端依赖
cd ../mcp-python
python -m pip install -r requirements.txt

# 安装 Node.js 后端依赖
cd ../mcp-node
pnpm install
```

### 开发

```powershell
# 启动前端开发服务器
cd web
pnpm dev

# 启动 Python 模型服务器
cd ../mcp-python
python main.py

# 启动 Node.js 服务器
cd ../mcp-node
pnpm dev
```

### 构建

```powershell
# 构建前端
cd web
pnpm build

# 构建桌面应用
cd ../electron
pnpm build
```

## 技术架构

### 前端架构

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

更多技术文档:
- [架构设计](./docs/architecture.md)
- [插件开发指南](./docs/plugin-development-guide.md)

## 多端支持

### Web

标准的 Web 应用，支持所有现代浏览器。使用 Vite 构建，支持 HMR 和快速开发。

### 桌面应用 (规划中)

基于 Electron 的桌面应用，提供更多本地功能:
- 本地模型支持
- 文件系统集成
- 系统托盘
- 离线使用

### 微信小程序 (规划中)

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

查看 [插件开发指南](./docs/plugin-development-guide.md) 了解更多。

## 贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](./LICENSE) 了解详情