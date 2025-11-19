import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import os from 'os';
import trash from 'trash';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const CONFIG_FILE = path.join(__dirname, 'config.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const DEFAULT_CONFIG = {
  postsPath: '',
  imagesPath: '',
  language: 'zh',
  theme: 'dark'
};

async function getConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    const userConfig = JSON.parse(data);
    return { ...DEFAULT_CONFIG, ...userConfig };
  } catch (error) {
    return { ...DEFAULT_CONFIG };
  }
}

async function saveConfig(config) {
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Multer 配置
const upload = multer({
  storage: multer.diskStorage({
    destination: async function (req, file, cb) {
      const config = await getConfig();
      if (!config.imagesPath) {
        return cb(new Error('Images path not configured'), null);
      }
      // req.body.folder should be available if appended before file in frontend
      const folder = req.body.folder || '';
      let dest = config.imagesPath;
      if (folder && folder !== 'root') {
        dest = path.join(config.imagesPath, folder);
        try {
          await fs.mkdir(dest, { recursive: true });
        } catch (e) {
          console.error("Create folder failed", e);
        }
      }
      cb(null, dest);
    },
    filename: function (req, file, cb) {
      // Solve Chinese character encoding issues
      const name = Buffer.from(file.originalname, 'latin1').toString('utf8');
      cb(null, name);
    }
  })
});

app.get('/', (req, res) => {
  res.send(`Hexo Editor Backend running on port ${PORT}`);
});

// API: 获取配置
app.get('/api/settings', async (req, res) => {
  res.json(await getConfig());
});

// API: 保存配置
app.post('/api/settings', async (req, res) => {
  await saveConfig(req.body);
  res.json({ success: true });
});

// API: 浏览系统目录 (用于设置界面的文件夹选择)
app.post('/api/browse', async (req, res) => {
  const dirPath = req.body.path || os.homedir();
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const folders = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    
    // 获取父目录
    const parentDir = path.dirname(dirPath);
    
    res.json({
      success: true,
      currentPath: dirPath,
      parentPath: parentDir !== dirPath ? parentDir : null,
      folders: folders
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: 获取所有文章
app.get('/api/posts', async (req, res) => {
  const config = await getConfig();
  if (!config.postsPath) {
    return res.json({ success: true, data: [] });
  }

  try {
    const files = await fs.readdir(config.postsPath);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    const posts = await Promise.all(mdFiles.map(async (filename) => {
      try {
        const content = await fs.readFile(path.join(config.postsPath, filename), 'utf-8');
        return {
          filename,
          content,
          rawBody: '', 
          frontMatter: {} 
        };
      } catch (readErr) {
        return null;
      }
    }));

    res.json({ success: true, data: posts.filter(Boolean) });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

// API: 保存文章
app.post('/api/posts', async (req, res) => {
  const config = await getConfig();
  const { filename, content } = req.body;
  
  if (!config.postsPath) return res.status(400).json({ error: 'Path not set' });

  try {
    await fs.writeFile(path.join(config.postsPath, filename), content, 'utf-8');
    res.json({ success: true, data: { filename, content } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: 删除文章 (移动到回收站)
app.delete('/api/posts/:filename', async (req, res) => {
  const config = await getConfig();
  if (!config.postsPath) return res.status(400).json({ error: 'Path not set' });

  try {
    const filePath = path.join(config.postsPath, req.params.filename);
    // 使用 trash 将文件移入回收站
    await trash([filePath]);
    res.json({ success: true });
  } catch (error) {
    console.error("Trash error:", error);
    res.status(500).json({ error: `Failed to move to trash: ${error.message}` });
  }
});

// API: 获取图片素材
app.get('/api/assets', async (req, res) => {
  const config = await getConfig();
  if (!config.imagesPath) return res.json({ success: true, data: [] });

  try {
    const assets = [];
    async function scanDir(dirPath, relativeDir = '') {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
             // Recursively scan subdirectories
             const nextRelative = relativeDir ? path.join(relativeDir, entry.name) : entry.name;
             await scanDir(path.join(dirPath, entry.name), nextRelative);
          } else if (entry.isFile() && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(entry.name)) {
            // Normalize folder name for frontend (use forward slashes)
            const folder = relativeDir.replace(/\\/g, '/') || 'root';
            
            // Display path (Hexo standard: /img/folder/name)
            const displayPath = `/img/${folder === 'root' ? '' : folder + '/'}${entry.name}`;
            // Web preview URL
            const webPath = `/api/image/${folder === 'root' ? '' : folder + '/'}${entry.name}`;
            
            assets.push({
              path: displayPath, 
              name: entry.name,
              folder: folder,
              url: webPath
            });
          }
        }
      } catch (e) {
        // ignore access errors in subfolders
      }
    }
    await scanDir(config.imagesPath);
    res.json({ success: true, data: assets });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

// API: 预览图片
app.get('/api/image/*', async (req, res) => {
  const config = await getConfig();
  if (!config.imagesPath) return res.status(404).send('Not found');

  const relPath = req.params[0];
  if (relPath.includes('..')) return res.status(403).send('Forbidden');

  const fullPath = path.join(config.imagesPath, relPath);
  try {
    await fs.access(fullPath);
    res.sendFile(fullPath);
  } catch (e) {
    res.status(404).send('Image not found');
  }
});

// API: 上传图片
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const folder = req.body.folder || '';
  const filename = req.file.filename; 
  
  const mdPath = `/img/${folder && folder !== 'root' ? folder + '/' : ''}${filename}`;
  const previewUrl = `/api/image/${folder && folder !== 'root' ? folder + '/' : ''}${filename}`;

  res.json({
    success: true,
    data: {
      path: mdPath,
      name: filename,
      folder: folder || 'root',
      url: previewUrl
    }
  });
});

// API: 重命名素材
app.post('/api/assets/rename', async (req, res) => {
  const config = await getConfig();
  if (!config.imagesPath) return res.status(400).json({ error: 'Images path not set' });

  const { folder, oldName, newName } = req.body;
  if (!oldName || !newName) return res.status(400).json({ error: 'Missing parameters' });

  const folderPath = (folder === 'root' || !folder) ? '' : folder;
  const oldFullPath = path.join(config.imagesPath, folderPath, oldName);
  const newFullPath = path.join(config.imagesPath, folderPath, newName);

  try {
    await fs.rename(oldFullPath, newFullPath);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: 删除素材 (移动到回收站)
app.delete('/api/assets', async (req, res) => {
    const config = await getConfig();
    if (!config.imagesPath) return res.status(400).json({ error: 'Images path not set' });
    
    const { folder, name } = req.query;
    if (!name) return res.status(400).json({ error: 'Missing name' });

    const folderPath = (folder === 'root' || !folder) ? '' : folder;
    const fullPath = path.join(config.imagesPath, folderPath, name);
    
    try {
        // 使用 trash 移入回收站
        await trash([fullPath]);
        res.json({ success: true });
    } catch (e) {
        console.error("Trash error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});