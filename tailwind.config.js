// tailwind.config.js
// Tailwind CSS is a UTILITY-FIRST CSS framework.
// Instead of writing CSS files like:
//   .my-button { background: blue; padding: 8px; border-radius: 4px }
// You write classes directly in HTML/JSX:
//   <button className="bg-blue-500 p-2 rounded">Click</button>
//
// This "content" line tells Tailwind WHERE to look for those class names
// so it only ships CSS you actually used (keeps the file tiny)

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // scan all JS/JSX files in src/
  ],
  // darkMode: 'class' means dark mode activates when you add
  // the class "dark" to the <html> element — we control this in code
  darkMode: 'class',
  theme: {
    extend: {
      // Custom font — we'll load this from Google Fonts in index.html
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
