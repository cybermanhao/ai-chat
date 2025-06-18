import { useEffect, useRef, useState } from 'react';
import { markdownToHtml, copyToClipboard } from '@/utils/markdown';
import { usePluginStore } from '@/store/pluginStore';
import './styles.less';

interface MarkdownProps {
    content: string;
    className?: string;
}

const Markdown = ({ content: initialContent, className = '' }: MarkdownProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { processContent } = usePluginStore();
    const [processedContent, setProcessedContent] = useState(initialContent);

    useEffect(() => {
        processContent(initialContent).then(setProcessedContent);
    }, [initialContent, processContent]);    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // 添加代码复制功能
        const copyBtns = container.querySelectorAll('.copy-btn');
        const handleCopy = async (e: Event) => {
            const btn = e.currentTarget as HTMLButtonElement;
            const code = decodeURIComponent(btn.dataset.code || '');
            if (!code) return;

            const success = await copyToClipboard(code);
            if (success) {
                btn.textContent = '已复制';
                setTimeout(() => {
                    btn.textContent = '复制';
                }, 2000);
            }
        };

        copyBtns.forEach(btn => {
            btn.addEventListener('click', handleCopy);
        });

        return () => {
            copyBtns.forEach(btn => {
                btn.removeEventListener('click', handleCopy);
            });
        };
    }, [processedContent]);

    return (
        <div
            ref={containerRef}            className={`markdown-body ${className}`}
            dangerouslySetInnerHTML={{ __html: markdownToHtml(processedContent) }}
        />
    );
};

export default Markdown;
