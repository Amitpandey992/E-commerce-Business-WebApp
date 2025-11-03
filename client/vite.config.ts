import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
    copyPublicDir: true,
  },
  publicDir: "public",
  server: {
    proxy: {
      '/api': {
        target: "http://localhost:8000/",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
