// vite.config.js
// Vite is a BUILD TOOL — think of it as the engine that:
//   1. Runs your app locally during development (with hot reload)
//   2. Bundles all your files into optimised HTML/CSS/JS for production
//
// Without Vite, the browser can't understand JSX (React's <Component /> syntax)
// Vite converts JSX → plain JavaScript the browser understands

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()], // This plugin enables JSX + React fast refresh
})
