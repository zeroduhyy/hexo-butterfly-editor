import React from 'react';
import { ViewMode, Theme } from '../types';

interface ToolbarProps {
  onSave: () => void;
  viewMode: ViewMode;
  onToggleView: (mode: ViewMode) => void;
  isDirty: boolean;
  onOpenSettings: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  t: (key: string) => string;
  disabled: boolean; 
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  onSave, 
  viewMode, 
  onToggleView, 
  isDirty,
  onOpenSettings,
  theme,
  onToggleTheme,
  t,
  disabled
}) => {

  return (
    <div className="h-14 bg-white/80 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4 flex-shrink-0 backdrop-blur-sm transition-colors duration-200">
      <div className="flex items-center space-x-2">
        <button 
          onClick={onSave}
          disabled={disabled || !isDirty}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
            !disabled && isDirty 
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
              : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
          {isDirty ? t('saveChanges') : t('saved')}
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-2"></div>

        <button 
          onClick={onOpenSettings}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors" 
          title={t('settings')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-2"></div>
        
        <button 
          onClick={onToggleTheme}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-500 dark:text-slate-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors" 
          title={theme === 'dark' ? t('light') : t('dark')}
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>
      </div>

      <div className="flex bg-gray-100 dark:bg-slate-900 p-0.5 rounded-lg border border-gray-200 dark:border-slate-700">
        <button 
          onClick={() => onToggleView(ViewMode.EDIT)}
          disabled={disabled}
          className={`px-3 py-1 rounded text-xs font-medium transition-all ${
            disabled ? 'text-gray-300 dark:text-slate-700 cursor-not-allowed' :
            viewMode === ViewMode.EDIT ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}
        >
          {t('editor')}
        </button>
        <button 
          onClick={() => onToggleView(ViewMode.SPLIT)}
          disabled={disabled}
          className={`px-3 py-1 rounded text-xs font-medium transition-all ${
            disabled ? 'text-gray-300 dark:text-slate-700 cursor-not-allowed' :
            viewMode === ViewMode.SPLIT ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}
        >
          {t('split')}
        </button>
        <button 
          onClick={() => onToggleView(ViewMode.PREVIEW)}
          disabled={disabled}
          className={`px-3 py-1 rounded text-xs font-medium transition-all ${
             disabled ? 'text-gray-300 dark:text-slate-700 cursor-not-allowed' :
            viewMode === ViewMode.PREVIEW ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}
        >
          {t('preview')}
        </button>
      </div>
    </div>
  );
};

export default Toolbar;