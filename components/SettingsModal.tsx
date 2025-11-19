import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
  initialSettings: AppSettings;
  t: (key: string) => string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, initialSettings, t }) => {
  const [settings, setSettings] = useState<AppSettings>(initialSettings);

  useEffect(() => {
    if (isOpen) {
      setSettings(initialSettings);
    }
  }, [isOpen, initialSettings]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-fade-in transition-colors duration-200">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settingsTitle')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
              {t('language')}
            </label>
            <select 
                value={settings.language}
                onChange={(e) => setSettings({...settings, language: e.target.value as 'zh' | 'en'})}
                className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            >
                <option value="zh">简体中文</option>
                <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
              {t('postsDir')}
            </label>
            <input 
              type="text" 
              value={settings.postsPath}
              onChange={(e) => setSettings({...settings, postsPath: e.target.value})}
              placeholder="D:\Hexo\source\_posts"
              className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                Input the absolute path to your Hexo <code>source/_posts</code> folder.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
              {t('imgDir')}
            </label>
            <input 
              type="text" 
              value={settings.imagesPath}
              onChange={(e) => setSettings({...settings, imagesPath: e.target.value})}
              placeholder="D:\Hexo\source\img"
              className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            />
             <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                Input the absolute path to your Hexo <code>source/img</code> folder.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            {t('cancel')}
          </button>
          <button 
            onClick={() => onSave(settings)}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-lg shadow-indigo-500/20 transition-all"
          >
            {t('saveConfig')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;