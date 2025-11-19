import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Toolbar from './components/Toolbar';
import SettingsModal from './components/SettingsModal';
import { fileService, parseFrontMatter } from './services/fileService';
import { BlogPost, ViewMode, Asset, AppSettings, Theme } from './types';
import { TRANSLATIONS } from './constants';

const App: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activePost, setActivePost] = useState<BlogPost | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.SPLIT);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Sidebar Resizing State
  const [sidebarWidth, setSidebarWidth] = useState(280); // Default 280px
  const isResizingRef = useRef(false);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    postsPath: '',
    imagesPath: '',
    language: 'zh',
    theme: 'dark'
  });

  // Translation Helper
  const t = useCallback((key: string) => {
    const lang = appSettings.language || 'zh';
    const dict = (TRANSLATIONS as any)[lang] || TRANSLATIONS['zh'];
    return dict[key] || key;
  }, [appSettings.language]);

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (appSettings.theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
  }, [appSettings.theme]);

  // Sidebar Resizing Logic
  const startResizing = useCallback((e: React.MouseEvent) => {
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isResizingRef.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizingRef.current) {
        const newWidth = e.clientX;
        if (newWidth > 150 && newWidth < 600) {
            setSidebarWidth(newWidth);
        }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  // Initialize Data from Backend
  const fetchData = async () => {
    setIsLoading(true);
    try {
        const settings = await fileService.getSettings();
        const safeSettings: AppSettings = {
            postsPath: settings.postsPath || '',
            imagesPath: settings.imagesPath || '',
            language: settings.language || 'zh',
            theme: settings.theme || 'dark'
        };
        
        setAppSettings(safeSettings);
        
        if (safeSettings.postsPath) {
            const [postsRes, assetsRes] = await Promise.all([
                fileService.getPosts(),
                fileService.getAssets()
            ]);

            if (postsRes.success && postsRes.data) {
                const sortedPosts = postsRes.data.sort((a, b) => {
                   // 1. 优先尝试按 Date FrontMatter 倒序 (新的在前)
                   const dateA = a.frontMatter?.date ? new Date(a.frontMatter.date).getTime() : 0;
                   const dateB = b.frontMatter?.date ? new Date(b.frontMatter.date).getTime() : 0;
                   if (dateA !== dateB) {
                       return dateB - dateA;
                   }

                   // 2. 如果日期相同或无效，按文件名数字倒序 (10.md 在 2.md 前面)
                   const nameA = a.filename.replace(/\.md$/i, '');
                   const nameB = b.filename.replace(/\.md$/i, '');
                   const numA = parseFloat(nameA);
                   const numB = parseFloat(nameB);

                   if (!isNaN(numA) && !isNaN(numB)) {
                       return numB - numA;
                   }

                   // 3. 最后按字符串自然排序
                   return nameB.localeCompare(nameA, undefined, { numeric: true, sensitivity: 'base' });
                });
                setPosts(sortedPosts);
            } else {
                if (postsRes.error) setErrorMsg(postsRes.error);
            }

            if (assetsRes.success && assetsRes.data) {
                setAssets(assetsRes.data);
            }
        } else {
            setIsSettingsOpen(true);
        }
    } catch (error) {
        console.error("Failed to load data", error);
        setErrorMsg("Connection failed");
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (newSettings: AppSettings) => {
      await fileService.saveSettings(newSettings);
      setAppSettings(newSettings);
      setIsSettingsOpen(false);
      fetchData();
  };

  const handleToggleTheme = () => {
      const newTheme = appSettings.theme === 'dark' ? 'light' : 'dark';
      const newSettings = { ...appSettings, theme: newTheme };
      handleSaveSettings(newSettings);
  };

  const handleCreatePost = async () => {
    const numericIds = posts
      .map(p => {
        const name = p.filename.replace(/\.md$/i, '');
        return /^\d+$/.test(name) ? parseInt(name, 10) : null;
      })
      .filter((n): n is number => n !== null);

    let nextId = 1;
    if (numericIds.length > 0) {
      nextId = Math.max(...numericIds) + 1;
    } else if (posts.length > 0) {
      nextId = posts.length + 1;
    }

    const title = String(nextId);
    const filename = `${title}.md`;
    
    if (posts.some(p => p.filename === filename)) {
        alert(t('fileExist'));
        return;
    }
    
    const res = await fileService.createPost(filename, title);
    
    if (res.success && res.data) {
      setPosts(prev => [res.data!, ...prev]);
      setActivePost(res.data);
    }
  };

  const handleDeletePost = async (filename: string) => {
      if (!window.confirm(t('deleteConfirm'))) return;

      const res = await fileService.deletePost(filename);
      if (res.success) {
          setPosts(prev => prev.filter(p => p.filename !== filename));
          if (activePost?.filename === filename) {
              setActivePost(null);
          }
      }
  };

  const handleSelectPost = (post: BlogPost) => {
    if (activePost?.isDirty && activePost.filename !== post.filename) {
      if(!confirm(`${t('unsaved')}?`)) return;
    }
    setActivePost(post);
  };

  const handleContentChange = (content: string) => {
    if (!activePost) return;
    const newFM = parseFrontMatter(content);
    const updatedPost = {
      ...activePost,
      content,
      isDirty: true,
      frontMatter: { ...activePost.frontMatter, ...newFM }
    };
    setActivePost(updatedPost);
    setPosts(prev => prev.map(p => p.filename === activePost.filename ? { ...updatedPost, isDirty: true } : p));
  };

  const handleSave = useCallback(async () => {
    if (!activePost) return;
    const res = await fileService.savePost(activePost);
    if (res.success) {
      const newFM = parseFrontMatter(activePost.content);
      const savedPost = { ...activePost, isDirty: false, frontMatter: newFM };
      setActivePost(savedPost);
      setPosts(prev => prev.map(p => p.filename === activePost.filename ? savedPost : p));
    } else {
        alert("Save failed");
    }
  }, [activePost]);

  // Ctrl+S ShortCut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault(); 
            if (activePost && activePost.isDirty) {
                handleSave();
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePost, handleSave]);

  const handleUploadAsset = async (file: File, folder: string) => {
      const res = await fileService.uploadImage(file, folder);
      if (res.success && res.data) {
          setAssets(prev => [res.data!, ...prev]);
      }
  };

  const handleRenameAsset = async (asset: Asset, newName: string) => {
      const res = await fileService.renameAsset(asset.folder, asset.name, newName);
      if (res.success) {
          // Refresh assets list properly
          const assetsRes = await fileService.getAssets();
          if (assetsRes.success && assetsRes.data) {
              setAssets(assetsRes.data);
          }
      } else {
          alert('Rename failed');
      }
  };

  const handleDeleteAsset = async (asset: Asset) => {
      const res = await fileService.deleteAsset(asset.folder, asset.name);
      if (res.success) {
          setAssets(prev => prev.filter(a => !(a.folder === asset.folder && a.name === asset.name)));
      } else {
          alert('Delete failed');
      }
  };

  const handleCopyAssetPath = (path: string) => {
    let relativePath = path;
    if (relativePath.startsWith('/')) {
        relativePath = '..' + relativePath;
    }
    navigator.clipboard.writeText(`![](${relativePath})`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-slate-400 transition-colors duration-200">
        <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      <Sidebar 
        posts={posts}
        assets={assets}
        activeFilename={activePost?.filename || null}
        onSelectPost={handleSelectPost}
        onCreatePost={handleCreatePost}
        onDeletePost={handleDeletePost}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCopyAssetPath={handleCopyAssetPath}
        onRenameAsset={handleRenameAsset}
        onDeleteAsset={handleDeleteAsset}
        onUploadAsset={handleUploadAsset}
        t={t}
        width={sidebarWidth}
      />

      {/* Dragger */}
      <div
        className="w-1 bg-gray-200 dark:bg-slate-700 hover:bg-indigo-500 dark:hover:bg-indigo-500 cursor-col-resize flex-shrink-0 transition-colors duration-150 z-20"
        onMouseDown={startResizing}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar is now always visible */}
        <Toolbar 
            onSave={handleSave}
            viewMode={viewMode}
            onToggleView={setViewMode}
            isDirty={!!activePost?.isDirty}
            onOpenSettings={() => setIsSettingsOpen(true)}
            theme={appSettings.theme}
            onToggleTheme={handleToggleTheme}
            t={t}
            disabled={!activePost}
        />

        {activePost ? (
            <Editor 
              post={activePost}
              assets={assets}
              onChange={handleContentChange}
              viewMode={viewMode}
              t={t}
            />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-slate-600 flex-col gap-4 bg-gray-100/50 dark:bg-slate-900/50 transition-colors duration-200">
            {errorMsg ? (
                 <div className="text-red-500 text-sm max-w-md text-center p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
                    <p className="font-bold mb-2">Connection Error</p>
                    <p>{t('connectionError')}</p>
                 </div>
            ) : (
                <>
                    <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center mb-4 border border-gray-200 dark:border-slate-700 shadow-sm">
                        <svg className="w-12 h-12 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <p className="font-medium">{t('selectPostTip')}</p>
                    <div className="flex gap-2 mt-2">
                        <button onClick={handleCreatePost} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded transition-colors">
                            {t('createNew')}
                        </button>
                    </div>
                </>
            )}
          </div>
        )}
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={handleSaveSettings}
        initialSettings={appSettings}
        t={t}
      />
    </div>
  );
};

export default App;