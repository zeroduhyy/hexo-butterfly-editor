import React, { useRef, useMemo } from 'react';
import { ViewMode, BlogPost, Asset } from '../types';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

interface EditorProps {
  post: BlogPost;
  assets: Asset[];
  onChange: (content: string) => void;
  viewMode: ViewMode;
  t: (key: string) => string;
}

const Editor: React.FC<EditorProps> = ({ post, assets, onChange, viewMode, t }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize markdown-it with HTML support and link attributes
  const md = useMemo(() => {
    return new MarkdownIt({
      html: true,          // Enable HTML tags in source
      linkify: true,       // Auto-convert URL-like text to links
      typographer: true,   // Enable smartquotes and other sweet transforms
      breaks: true         // Convert '\n' in paragraphs into <br>
    });
  }, []);

  const getPreviewContent = (content: string) => {
    // Strip FrontMatter
    return content.replace(/^---[\s\S]*?---\n/, '');
  };

  // Helper to resolve image paths for Hexo
  const resolveImagePath = (src: string) => {
    let cleanSrc = src.trim();
    
    // Handle <url> format if present
    if (cleanSrc.startsWith('<') && cleanSrc.endsWith('>')) {
      cleanSrc = cleanSrc.slice(1, -1);
    }

    // Prevent double prefixing if it's already an API path
    if (cleanSrc.startsWith('/api/image/') || cleanSrc.startsWith('api/image/')) {
      return cleanSrc.startsWith('/') ? cleanSrc : '/' + cleanSrc;
    }
    
    // Skip external links and data URIs
    if (cleanSrc.startsWith('http') || cleanSrc.startsWith('//') || cleanSrc.startsWith('data:')) {
      return cleanSrc;
    }
    
    // Detect Hexo standard paths (containing "img/" or "images/")
    // e.g. "../img/18/1.jpg" -> "18/1.jpg"
    const imgMatch = cleanSrc.match(/(?:img|images)[\\\/](.*)/i);
    
    if (imgMatch && imgMatch[1]) {
      return `/api/image/${imgMatch[1]}`;
    } 
    
    // Relative paths without explicit 'img' folder
    // e.g. "18/3.png" or "../18/3.png" -> "18/3.png"
    let normalized = cleanSrc.replace(/^(\.{1,2}[\\\/])+/g, '');
    
    // Clean up leading slash
    if (normalized.startsWith('/') || normalized.startsWith('\\')) {
      normalized = normalized.substring(1);
    }

    return `/api/image/${normalized}`;
  };

  const renderMarkdown = (text: string) => {
    const markdownContent = getPreviewContent(text);
    
    // Render markdown to HTML
    let html = md.render(markdownContent);
    
    // Post-process: Fix image paths for Hexo convention
    html = html.replace(/<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi, (match, before, src, after) => {
      const resolvedSrc = resolveImagePath(src);
      return `<img ${before}src="${resolvedSrc}"${after} class="my-4 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm max-w-full block mx-auto" />`;
    });

    // Add Tailwind classes to rendered elements
    html = html
      .replace(/<h1>/g, '<h1 class="text-3xl font-bold mb-4 text-gray-900 dark:text-slate-100 border-b border-gray-200 dark:border-slate-700 pb-2">')
      .replace(/<h2>/g, '<h2 class="text-2xl font-bold mb-3 text-gray-800 dark:text-slate-200 mt-6">')
      .replace(/<h3>/g, '<h3 class="text-xl font-bold mb-2 text-gray-800 dark:text-slate-200 mt-4">')
      .replace(/<h4>/g, '<h4 class="text-lg font-bold mb-2 text-gray-700 dark:text-slate-300 mt-3">')
      .replace(/<h5>/g, '<h5 class="text-base font-bold mb-1 text-gray-700 dark:text-slate-300 mt-2">')
      .replace(/<h6>/g, '<h6 class="text-sm font-bold mb-1 text-gray-600 dark:text-slate-400 mt-2">')
      .replace(/<strong>/g, '<strong class="text-indigo-600 dark:text-indigo-400 font-bold">')
      .replace(/<em>/g, '<em class="italic text-gray-600 dark:text-slate-300">')
      .replace(/<a\s+/g, '<a class="text-indigo-600 dark:text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer" ')
      .replace(/<blockquote>/g, '<blockquote class="border-l-4 border-indigo-500 pl-4 italic text-gray-500 dark:text-slate-400 my-4 py-2 bg-gray-50 dark:bg-slate-800/50 rounded-r">')
      .replace(/<hr\s*\/?>/g, '<hr class="my-6 border-gray-200 dark:border-slate-700" />')
      .replace(/<code>/g, '<code class="bg-gray-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded text-sm font-mono">')
      .replace(/<pre><code/g, '<pre class="bg-gray-900 text-slate-300 p-4 rounded-lg my-4 overflow-x-auto border border-gray-800"><code class="font-mono text-sm leading-normal"')
      .replace(/<ul>/g, '<ul class="list-disc list-inside my-4 space-y-2 text-gray-700 dark:text-slate-300">')
      .replace(/<ol>/g, '<ol class="list-decimal list-inside my-4 space-y-2 text-gray-700 dark:text-slate-300">')
      .replace(/<li>/g, '<li class="ml-4">')
      .replace(/<table>/g, '<table class="min-w-full my-4 border border-gray-200 dark:border-slate-700">')
      .replace(/<thead>/g, '<thead class="bg-gray-100 dark:bg-slate-800">')
      .replace(/<th>/g, '<th class="border border-gray-200 dark:border-slate-700 px-4 py-2 text-left font-bold text-gray-700 dark:text-slate-300">')
      .replace(/<td>/g, '<td class="border border-gray-200 dark:border-slate-700 px-4 py-2 text-gray-600 dark:text-slate-400">');

    // Sanitize HTML to prevent XSS attacks
    const cleanHtml = DOMPurify.sanitize(html, {
      ADD_ATTR: ['target', 'rel'], // Allow target and rel attributes for links
      ADD_TAGS: ['iframe'],         // Allow iframe if needed (be careful with this)
      FORBID_TAGS: ['script', 'style'], // Explicitly forbid dangerous tags
    });

    return { __html: cleanHtml };
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