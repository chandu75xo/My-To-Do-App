// main.jsx — the ENTRY POINT of the React app
//
// This file does one job: find the <div id="root"> in index.html
// and tell React to take it over and render the App component inside it.
//
// You'll rarely need to touch this file.

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'  // imports global CSS + Tailwind

// ReactDOM.createRoot() creates a React "root" — a container React manages
// document.getElementById('root') finds our <div id="root"> in index.html
// .render(<App />) tells React to draw the App component inside that div
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode is a development tool — it runs your components twice
  // to help catch bugs early. It has no effect in production builds.
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
