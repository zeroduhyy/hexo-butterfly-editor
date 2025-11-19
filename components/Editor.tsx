import React, { useRef, useEffect } from 'react';
import { ViewMode, BlogPost, Asset } from '../types';

interface EditorProps {
  post: BlogPost;
  assets: Asset[];
  onChange: (content: string) => void;
  viewMode: ViewMode;
  t: (key: string) => string;
}

const Editor: React.FC<EditorProps> = ({ post, assets, onChange, viewMode, t }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getPreviewContent = (content: string) => {
    // Strip FrontMatter
    return content.replace(/^---[\s\S]*?---\n/, '');
  };

  const renderMarkdown = (text: string) => {
    let html = getPreviewContent(text);

    // Helper: Escape HTML to prevent rendering tags inside code blocks
    const escapeHtml = (unsafe: string) => {
      return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
    };

    // Storage for placeholders
    const codeBlocks: string[] = [];
    const inlineCodes: string[] = [];

    // 1. Extract Code Blocks (```lang ... ```)
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
      const escapedCode = escapeHtml(code);
      const langClass = lang ? `language-${lang}` : '';
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      
      const blockHtml = `<pre class="bg-gray-900 text-slate-300 p-4 rounded-lg my-4 overflow-x-auto border border-gray-800 font-mono text-sm leading-normal"><code class="${langClass}">${escapedCode}</code></pre>`;
      
      codeBlocks.push(blockHtml);
      return placeholder;
    });

    // 2. Extract Inline Code (`...`)
    html = html.replace(/`([^`]+)`/g, (match, code) => {
      const escapedCode = escapeHtml(code);
      const placeholder = `__INLINE_CODE_${inlineCodes.length}__`;
      
      const inlineHtml = `<code class="bg-gray-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded text-sm font-mono">${escapedCode}</code>`;
      
      inlineCodes.push(inlineHtml);
      return placeholder;
    });

    // Helper to resolve image path
    const resolveImagePath = (src: string) => {
        let cleanSrc = src.trim();
        // Handle <url> format if present
        if (cleanSrc.startsWith('<') && cleanSrc.endsWith('>')) {
            cleanSrc = cleanSrc.slice(1, -1);
        }

        // FIX: Prevent double prefixing if it's already an API path
        if (cleanSrc.startsWith('/api/image/') || cleanSrc.startsWith('api/image/')) {
             return cleanSrc.startsWith('/') ? cleanSrc : '/' + cleanSrc;
        }
        
        // Skip external links and data URIs
        if (cleanSrc.startsWith('http') || cleanSrc.startsWith('//') || cleanSrc.startsWith('data:')) {
             return cleanSrc;
        }
        
        // Logic 1: Detect Hexo standard paths (containing "img/" or "images/")
        // e.g. "../img/18/1.jpg" -> "18/1.jpg"
        const imgMatch = cleanSrc.match(/(?:img|images)[\\\/](.*)/i);
        
        if (imgMatch && imgMatch[1]) {
            return `/api/image/${imgMatch[1]}`;
        } 
        
        // Logic 2: Relative paths without explicit 'img' folder
        // e.g. "18/3.png" or "../18/3.png" -> "18/3.png"
        let normalized = cleanSrc.replace(/^(\.{1,2}[\\\/])+/g, '');
        
        // Clean up leading slash
        if (normalized.startsWith('/') || normalized.startsWith('\\')) {
            normalized = normalized.substring(1);
        }

        return `/api/image/${normalized}`;
    };

    // 3. Process Standard Markdown Images ![alt](url)
    html = html.replace(/!\[(.*?)\]\(\s*(.*?)\s*\)/g, (match, alt, src) => {
        const realSrc = resolveImagePath(src);
        return `<img alt='${alt}' src='${realSrc}' class='my-4 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm max-w-full block mx-auto' />`;
    });

    // 4. Process HTML Image Tags <img src="...">
    // Robust regex to handle attributes, spaces, and different quote styles
    html = html.replace(/<img\s+(?:[^>]*?\s+)?src\s*=\s*(["'])(.*?)\1[^>]*?>/gi, (match, quote, src) => {
        const realSrc = resolveImagePath(src);
        return `<img src='${realSrc}' class='my-4 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm max-w-full block mx-auto' />`;
    });
    
    // Also handle cases where quotes might be missing or format is loose (fallback)
    // Matches <img ... src=... > if the above strict regex missed it
    html = html.replace(/<img\s+(?=[^>]*\ssrc\s*=\s*([^>\s]+))[^>]*>/gi, (match, src) => {
         // If specifically matched above, this might not be needed, but keeps it safe for unquoted src
         const realSrc = resolveImagePath(src.replace(/['"]/g, '')); 
         return `<img src='${realSrc}' class='my-4 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm max-w-full block mx-auto' />`;
    });

    // 5. Process Standard Markdown Headings and other elements
    html = html
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-4 text-gray-900 dark:text-slate-100 border-b border-gray-200 dark:border-slate-700 pb-2">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mb-3 text-gray-800 dark:text-slate-200 mt-6">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mb-2 text-gray-800 dark:text-slate-200 mt-4">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-600 dark:text-indigo-400 font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-600 dark:text-slate-300">$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' target='_blank' class='text-indigo-600 dark:text-indigo-400 hover:underline'>$1</a>")
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-indigo-500 pl-4 italic text-gray-500 dark:text-slate-400 my-4 py-1 bg-gray-50 dark:bg-slate-800/50 rounded-r">$1</blockquote>')
      .replace(/^---$/gim, '<hr class="my-6 border-gray-200 dark:border-slate-700" />');

    // 6. Convert newlines to breaks (only for the text outside code blocks)
    html = html.replace(/\n/g, '<br />');

    // 7. Restore Code Blocks
    html = html.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
       return codeBlocks[parseInt(index, 10)];
    });

    // 8. Restore Inline Code
    html = html.replace(/__INLINE_CODE_(\d+)__/g, (match, index) => {
       return inlineCodes[parseInt(index, 10)];
    });

    return { __html: html };
  };

  const showEditor = viewMode === ViewMode.EDIT || viewMode === ViewMode.SPLIT;
  const showPreview = viewMode === ViewMode.PREVIEW || viewMode === ViewMode.SPLIT;

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {showEditor && (
        <div className={`h-full flex flex-col ${viewMode === ViewMode.SPLIT ? 'w-1/2 border-r border-gray-200 dark:border-slate-700' : 'w-full'}`}>
           <div className="bg-gray-50 dark:bg-slate-800 px-4 py-2 text-xs font-mono text-gray-500 dark:text-slate-500 uppercase tracking-wider select-none border-b border-gray-200 dark:border-slate-700">
             {t('markdownSource')}
           </div>
          <textarea
            ref={textareaRef}
            value={post.content}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 w-full bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed transition-colors duration-200"
            spellCheck={false}
          />
        </div>
      )}

      {showPreview && (
        <div className={`h-full bg-white dark:bg-slate-900 flex flex-col ${viewMode === ViewMode.SPLIT ? 'w-1/2' : 'w-full'}`}>
             <div className="bg-gray-50 dark:bg-slate-800 px-4 py-2 text-xs font-mono text-gray-500 dark:text-slate-500 uppercase tracking-wider select-none border-b border-gray-200 dark:border-slate-700 flex justify-between">
                <span>{t('preview')}</span>
                <span className="text-indigo-500 dark:text-indigo-400 opacity-75">{t('previewTitle')}</span>
             </div>
             
            <div className="relative flex-1 overflow-y-auto bg-white dark:bg-slate-900 transition-colors duration-200">
                <div className="bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 p-3 m-4 text-xs text-amber-700 dark:text-amber-200/80">
                    {t('renderingNote')}
                </div>

                <div 
                    className="p-8 prose prose-slate dark:prose-invert max-w-none text-gray-700 dark:text-slate-300"
                    dangerouslySetInnerHTML={renderMarkdown(post.content)}
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default Editor;