import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages раздаёт сайт не по доменному корню, а под путём репозитория.
// Поэтому базовый путь нужно учитывать.
const base = process.env.VITE_BASE_URL ?? '/'

export default defineConfig({
  base,
  plugins: [vue()],
})

