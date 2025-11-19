export interface FrontMatter {
  title: string;
  date: string;
  tags?: string[];
  categories?: string[];
  cover?: string;
  [key: string]: any;
}

export interface BlogPost {
  filename: string; // e.g., "hello-world.md"
  content: string;  // The full content including frontmatter
  frontMatter: FrontMatter;
  rawBody: string;  // Content without frontmatter
  isDirty?: boolean; // Has unsaved changes
}

export interface Asset {
  path: string; // e.g., "/img/18/1.jpg"
  name: string; // "1.jpg"
  folder: string; // "18"
  url: string; // Real URL (or mock URL) for display
}

export type Language = 'zh' | 'en';
export type Theme = 'light' | 'dark';

export interface AppSettings {
  postsPath: string;
  imagesPath: string;
  language: Language;
  theme: Theme;
}

export enum ViewMode {
  EDIT = 'EDIT',
  PREVIEW = 'PREVIEW',
  SPLIT = 'SPLIT'
}

export interface FileServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}