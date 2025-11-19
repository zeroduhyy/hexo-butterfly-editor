import React, { useMemo, useState } from 'react';
import { BlogPost, Asset } from '../types';

interface SidebarProps {
  posts: BlogPost[];
  assets: Asset[];
  activeFilename: string | null;
  onSelectPost: (post: BlogPost) => void;
  onCreatePost: () => void;
  onDeletePost: (filename: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onCopyAssetPath: (path: string) => void;
  onRenameAsset: (asset: Asset, newName: string) => void;
  onDeleteAsset: (asset: Asset) => void;
  onUploadAsset: (file: File, folder: string) => void;
  t: (key: string) => string;
  width: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  posts, 
  assets,
  activeFilename, 
  onSelectPost, 
  onCreatePost,
  onDeletePost,
  searchTerm,
  onSearchChange,
  onCopyAssetPath,
  onRenameAsset,
  onDeleteAsset,
  onUploadAsset,
  t,
  width
}) => {
  const [tab, setTab] = useState<'posts' | 'images'>('posts');
  const [draggingFolder, setDraggingFolder] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    if (!Array.isArray(posts)) return [];
    
    const map = new Map<string, BlogPost>();
    posts.forEach(p => {
        if(p && p.filename) map.set(p.filename, p);
    });
    const uniquePosts = Array.from(map.values());
    
    return uniquePosts.filter(p => {
      const title = (p && p.frontMatter && p.frontMatter.title) ? p.frontMatter.title : '';
      const filename = p.filename || '';
      
      return title.toLowerCase().includes(searchTerm.toLowerCase()) || 
             filename.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [posts, searchTerm]);

  const groupedAssets = useMemo(() => {
    const groups: Record<string, Asset[]> = {};
    if (!Array.isArray(assets)) return groups;
    
    assets.forEach(a => {
        const folder = a.folder || 'root';
        if (!groups[folder]) groups[folder] = [];
        groups[folder].push(a);
    });

    // Ensure current active post's folder exists in the list (even if empty) to allow drag & drop
    if (activeFilename) {
        const activeFolder = activeFilename.replace(/\.md$/i, '');
        if (!groups[activeFolder]) {
            groups[activeFolder] = [];
        }
    }

    if (searchTerm) {
        Object.keys(groups).forEach(key => {
            groups[key] = groups[key].filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.path.includes(searchTerm));
            // Don't delete empty groups if it's the active folder (unless it doesn't match search)
            if (groups[key].length === 0 && key !== activeFilename?.replace(/\.md$/i, '')) {
                delete groups[key];
            }
        });
    }
    return groups;
  }, [assets, searchTerm, activeFilename]);

  const handleDrop = (e: React.DragEvent, folder: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingFolder(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        Array.from(e.dataTransfer.files).forEach((file: File) => {
            if (file.type.startsWith('image/')) {
                onUploadAsset(file, folder);
            }
        });
    }
  };

  const handleRenameClick = (e: React.MouseEvent, asset: Asset) => {
      e.preventDefault();
      e.stopPropagation();
      const newName = prompt(t('enterNewName'), asset.name);
      if (newName && newName !== asset.name) {
          onRenameAsset(asset, newName);
      }
  };

  const handleDeleteClick = (e: React.MouseEvent, asset: Asset) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm(t('confirmDeleteAsset'))) {
          onDeleteAsset(asset);
      }
  };

  return (
    <div 
      style={{ width: width }}
      className="bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col h-full text-gray-600 dark:text-slate-300 flex-shrink-0 transition-colors duration-200"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-bold text-lg tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <span className="p-1 bg-indigo-600 rounded text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </span>
            {t('appName')}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-200 dark:bg-slate-800 rounded p-1 mb-3">
            <button 
                onClick={() => setTab('posts')}
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${tab === 'posts' ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
            >
                {t('posts')}
            </button>
            <button 
                onClick={() => setTab('images')}
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${tab === 'images' ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
            >
                {t('assets')}
            </button>
        </div>

        {tab === 'posts' && (
            <button 
            onClick={onCreatePost}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20"
            >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {t('newArticle')}
            </button>
        )}
      </div>

      {/* Search */}
      <div className="px-3 pb-3 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
        <div className="relative">
          <input 
            type="text" 
            placeholder={tab === 'posts' ? t('filterPosts') : t('filterAssets')} 
            className="w-full bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-slate-200 rounded px-3 py-2 pl-9 focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-gray-300 dark:border-slate-700 placeholder-gray-400 dark:placeholder-slate-500"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <svg className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
        {tab === 'posts' ? (
            filteredPosts.length === 0 ? (
            <div className="p-6 text-center text-gray-400 dark:text-slate-600 text-sm">{t('noPosts')}</div>
            ) : (
            <ul className="divide-y divide-gray-100 dark:divide-slate-800/50">
                {filteredPosts.map((post) => {
                    // Fix TypeScript errors by casting fallback object to any
                    const fm = post.frontMatter || ({} as any);
                    const hasTitle = fm.title && fm.title.trim() !== '';
                    const displayTitle = hasTitle ? fm.title : post.filename;
                    const date = fm.date ? (typeof fm.date === 'string' ? fm.date.slice(0, 10) : 'No date') : '';
                    const isSelected = activeFilename === post.filename;
                    
                    return (
                        <li key={post.filename} className="relative group">
                            <button
                            onClick={() => onSelectPost(post)}
                            className={`w-full text-left px-4 py-3 text-sm transition-all relative pr-10 ${
                                isSelected
                                ? 'bg-indigo-50 dark:bg-slate-800/80'
                                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/30'
                            }`}
                            >
                                {isSelected && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                                )}
                                <div className="flex items-start gap-3">
                                    <div className={`mt-0.5 flex-shrink-0 ${isSelected ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-600'}`}>
                                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className={`font-medium truncate mb-0.5 leading-tight ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-700 dark:text-slate-300'}`}>
                                            {displayTitle}
                                        </div>
                                        <div className="text-[10px] text-gray-400 dark:text-slate-500 font-mono truncate opacity-80">
                                            {post.filename}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            {post.isDirty && (
                                                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 text-[9px] font-bold tracking-wide uppercase">{t('unsaved')}</span>
                                            )}
                                            <span className="text-[10px] text-gray-400 dark:text-slate-600">{date}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                            
                            <div className="absolute right-2 top-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onDeletePost(post.filename);
                                    }}
                                    className="p-1.5 text-gray-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
                                    title="Delete Post"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
            )
        ) : (
            // ASSETS LIST
            Object.keys(groupedAssets).length === 0 && !activeFilename ? (
                <div className="p-6 text-center text-gray-400 dark:text-slate-600 text-sm">{t('noAssets')}</div>
            ) : (
                <div className="space-y-6 p-4">
                    {Object.entries(groupedAssets)
                      .sort(([keyA], [keyB]) => {
                          const numA = parseFloat(keyA);
                          const numB = parseFloat(keyB);
                          const isNumA = !isNaN(numA) && /^\d+$/.test(keyA);
                          const isNumB = !isNaN(numB) && /^\d+$/.test(keyB);

                          if (isNumA && isNumB) return numB - numA; // Descending order for numbers
                          if (isNumA) return -1; // Numbers first
                          if (isNumB) return 1;
                          return keyA.localeCompare(keyB);
                      })
                      .map(([folder, rawFiles]) => {
                        const files = rawFiles as Asset[];
                        return (
                        <div 
                            key={folder} 
                            className={`animate-fade-in p-2 rounded-lg transition-colors border border-transparent ${draggingFolder === folder ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-500 border-dashed' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDraggingFolder(folder); }}
                            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDraggingFolder(null); }}
                            onDrop={(e) => handleDrop(e, folder)}
                        >
                            <div className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2 pb-1 select-none">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                /img/{folder === 'root' ? '' : folder + '/'}
                            </div>
                            
                            {files.length === 0 ? (
                                <div className="text-center py-4 text-gray-400 dark:text-slate-600 text-xs italic border-2 border-dashed border-gray-200 dark:border-slate-700 rounded">
                                    {t('dropToUpload')}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {files.map(asset => (
                                        <div 
                                            key={asset.path}
                                            className="group relative aspect-square bg-gray-100 dark:bg-slate-800 rounded-md overflow-hidden border border-gray-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all"
                                        >
                                            {/* Main Image - Click to copy path */}
                                            <img 
                                                src={asset.url} 
                                                alt={asset.name} 
                                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer" 
                                                onClick={() => onCopyAssetPath(asset.path)}
                                                title={t('copyPath')}
                                            />
                                            
                                            {/* Overlay with Actions */}
                                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[1px] gap-2 pointer-events-none group-hover:pointer-events-auto">
                                                
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCopyAssetPath(asset.path);
                                                    }}
                                                    className="text-[9px] text-white font-medium bg-indigo-600 px-2 py-0.5 rounded-full shadow mb-1 hover:bg-indigo-500 transition-colors border-none cursor-pointer"
                                                >
                                                    {t('copyPath')}
                                                </button>
                                                
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={(e) => handleRenameClick(e, asset)}
                                                        className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors border-none cursor-pointer flex items-center justify-center"
                                                        title={t('rename')}
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDeleteClick(e, asset)}
                                                        className="p-1.5 bg-white/20 hover:bg-red-500/80 rounded-full text-white transition-colors border-none cursor-pointer flex items-center justify-center"
                                                        title={t('delete')}
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 p-1.5 text-[9px] truncate text-center text-gray-600 dark:text-slate-300 border-t border-gray-200 dark:border-slate-800 pointer-events-none">
                                                {asset.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        )
                    })}
                </div>
            )
        )}
      </div>
    </div>
  );
};

export default Sidebar;