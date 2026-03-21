// postcss.config.js
// PostCSS is a CSS processor — it runs BEFORE the browser sees your CSS.
// Tailwind uses PostCSS to scan your code and generate the final CSS file.
// You don't need to understand this deeply — just know it's required for Tailwind to work.

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}, // automatically adds vendor prefixes like -webkit- for older browsers
  },
}
