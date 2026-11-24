import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    // 编辑器/工具写入文件时会短暂生成临时目录，watcher 撞上会 EBUSY 崩溃。
    watch: {
      ignored: ['**/*.tmpdir/**', '**/*.tmp', '**/.git/**', '**/dist/**'],
    },
  },
  build: {
    target: 'es2020',
  },
});
