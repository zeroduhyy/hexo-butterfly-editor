import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 将 /api 开头的请求代理到后端 3000 端口
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // 简单的环境变量 polyfill，使用空对象防止 process.env 报错
  define: {
    'process.env': {}
  }
});
