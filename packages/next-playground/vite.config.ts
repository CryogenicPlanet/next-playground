import path from 'path'

import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'

import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: ['src/api.ts', 'src/index.ts'].map((v) =>
        path.resolve(__dirname, v)
      ),
      name: pkg.name,
      fileName: (format, name) => `${name}.${format}.js`
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['react', 'fs', 'node:fs/promises'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          react: 'react',
          fs: 'fs'
        }
      }
    }
  }
})
