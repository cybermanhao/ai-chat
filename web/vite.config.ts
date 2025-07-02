import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  root: __dirname, // 让 Vite 以 web/ 目录为根目录，解决 index.html 入口问题
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: '@engine', replacement: path.resolve(__dirname, '../engine') },
      { find: 'node:stream', replacement: path.resolve(__dirname, './empty-module.js') },
      { find: 'stream', replacement: path.resolve(__dirname, './empty-module.js') },
    ],
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
        },
      },
    },
  },
})

// web/public/avatar 目录下的图片可通过 /avatar/xxx.png 直接访问
// 注意：avatar 文件需要在 web/public/avatar/ 目录中，而不是项目根目录的 public/avatar/
// 参考: https://vitejs.dev/guide/assets.html#the-public-directory
