import { BlogPost, FileServiceResponse, FrontMatter, Asset, AppSettings } from '../types';
import { API_BASE_URL } from '../constants';

// Helper to parse frontmatter
export const parseFrontMatter = (fullContent: string): FrontMatter => {
  const fmRegex = /^---\n([\s\S]*?)\n---\n/;
  const match = fullContent.match(fmRegex);
  
  const frontMatter: FrontMatter = { title: '', date: new Date().toISOString() };

  if (match) {
    const fmRaw = match[1];
    fmRaw.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > -1) {
        const key = line.slice(0, colonIndex).trim();
        const val = line.slice(colonIndex + 1).trim();
        
        if (val.startsWith('[') && val.endsWith(']')) {
             frontMatter[key] = val.slice(1, -1).split(',').map(s => s.trim());
        } else {
             frontMatter[key] = val;
        }
      }
    });
  }
  return frontMatter;
};

const parsePost = (filename: string, fullContent: string): BlogPost => {
  const frontMatter = parseFrontMatter(fullContent);
  const rawBody = fullContent.replace(/^---\n[\s\S]*?\n---\n/, '');

  if (!frontMatter.title) {
      frontMatter.title = filename.replace(/\.md$/i, '');
  }

  return { filename, content: fullContent, frontMatter, rawBody };
};

export const fileService = {
  
  // Get Settings
  async getSettings(): Promise<AppSettings> {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`);
      return await res.json();
    } catch (e) {
      console.error(e);
      return { postsPath: '', imagesPath: '', language: 'zh', theme: 'dark' };
    }
  },

  // Save Settings
  async saveSettings(settings: AppSettings): Promise<void> {
    await fetch(`${API_BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
  },

  // Get all posts
  async getPosts(): Promise<FileServiceResponse<BlogPost[]>> {
    try {
      const res = await fetch(`${API_BASE_URL}/posts`);
      const json = await res.json();
      if (!json.success) return json;

      // Parse content on client side
      const posts = json.data.map((p: any) => parsePost(p.filename, p.content));
      return { success: true, data: posts };
    } catch (e) {
      return { success: false, error: 'Connection Error' };
    }
  },

  // Save a post
  async savePost(post: BlogPost): Promise<FileServiceResponse<BlogPost>> {
    try {
      const res = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: post.filename, content: post.content })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Save failed' };
    }
  },

  // Create new post
  async createPost(filename: string, title: string): Promise<FileServiceResponse<BlogPost>> {
    // Beijing Time (UTC+8) Calculation
    const now = new Date();
    const utc8Time = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const dateStr = utc8Time.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');

    const template = `---
title: ${title}
date: ${dateStr}
cover: /img/${title}/1.jpg

#标签
tags:
  - note

#分类
categories:
  - Daily
abbrlink:
---

`;
    const newPost = parsePost(filename, template);
    return this.savePost(newPost);
  },

  // Delete post
  async deletePost(filename: string): Promise<FileServiceResponse<void>> {
    await fetch(`${API_BASE_URL}/posts/${filename}`, { method: 'DELETE' });
    return { success: true };
  },

  // Get Assets
  async getAssets(): Promise<FileServiceResponse<Asset[]>> {
    try {
      const res = await fetch(`${API_BASE_URL}/assets`);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  // Upload Image
  async uploadImage(file: File, folderName: string): Promise<FileServiceResponse<Asset>> {
    const formData = new FormData();
    // IMPORTANT: Append 'folder' BEFORE 'file' so Multer can access it in destination callback
    formData.append('folder', folderName);
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    return await res.json();
  },

  // Rename Asset
  async renameAsset(folder: string, oldName: string, newName: string): Promise<FileServiceResponse<void>> {
    const res = await fetch(`${API_BASE_URL}/assets/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder, oldName, newName })
    });
    return await res.json();
  },

  // Delete Asset
  async deleteAsset(folder: string, name: string): Promise<FileServiceResponse<void>> {
      const query = new URLSearchParams({ folder, name }).toString();
      const res = await fetch(`${API_BASE_URL}/assets?${query}`, {
          method: 'DELETE'
      });
      return await res.json();
  }
};