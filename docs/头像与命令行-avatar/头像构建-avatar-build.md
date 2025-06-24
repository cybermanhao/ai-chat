# 头像构建命令行说明

本项目支持自动批量生成多尺寸头像图片，提升前端性能和开发体验。

## 功能简介
- 支持将 public/avatar 目录下的大图自动生成 32/48/64/96/128 等多尺寸头像。
- 默认只生成缺失的尺寸，不会覆盖已存在的头像。
- 支持 `--force` 参数全量重建所有尺寸。
- 构建过程集成了 chalk/ora 彩色动画，进度友好美观。
- 已集成到 dev/build 脚本，无需手动操作。

## 使用方法

### 1. 手动生成头像

```sh
pnpm run generate:avatars           # 只生成缺失尺寸
pnpm run generate:avatars -- --force # 全量重建所有尺寸
```

### 2. 集成到开发/构建流程
- 运行 `pnpm run dev` 或 `pnpm run build` 时会自动生成头像，无需关心。
- 头像原图放在 `public/avatar/`，命名如 `chatgpt.png`，自动生成 `chatgpt-64.png` 等多尺寸。

### 3. 依赖说明
- 需安装依赖：`sharp`、`chalk`、`ora`
- 安装命令：
```sh
pnpm add -D sharp chalk ora
```

### 4. 代码中如何引用
- 推荐用 `AvatarIcon` 组件，自动按 `provider+size` 选择图片。
- 也可用 `avatarIconUrl('chatgpt', 64)` 获取路径。

---

如需自定义尺寸、动画或其它需求，请参考 `scripts/generate-avatars.js` 脚本自行扩展。
