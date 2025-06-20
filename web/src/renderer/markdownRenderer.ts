import { markdownToHtml } from '@engine/utils/markdown';
import type { ContentRenderer } from './types';

export class MarkdownRenderer implements ContentRenderer {
  name = 'markdown';  priority = 100; // 最后执行
  test() {
    // Markdown 渲染器总是返回 true,因为它是最后的 fallback
    return true;
  }

  render(content: string) {
    return markdownToHtml(content);
  }
}

// 已从 engine/render/markdownRenderer.ts 移动至 web/src/renderer/markdownRenderer.ts，UI 渲染相关实现应只在 web 端维护。
