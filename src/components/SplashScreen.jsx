// SplashScreen.jsx
// Shown for ~3.4s on app load.
// After animation completes, calls onDone() to reveal the main app.

import { useEffect } from 'react'

export default function SplashScreen({ onDone }) {

  useEffect(() => {
    const timer = setTimeout(onDone, 3400)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 overflow-hidden">

      {/* Radial glow */}
      <div className="absolute w-80 h-80 rounded-full pointer-events-none" style={{
        background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
        animation: 'splashGlow 3s ease-in-out infinite',
      }}/>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center gap-6">

        {/* Circle + tick */}
        <div style={{ animation: 'splashMarkDrop 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.2s both' }}>
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full" style={{
              border: '2px solid rgba(255,255,255,0.15)',
              animation: 'splashCircle 0.5s ease-out 0.2s both',
            }}/>
            <svg className="absolute inset-0 m-auto" width="36" height="36" viewBox="0 0 36 36">
              <path
                d="M9 19L15 25L27 12"
                fill="none" stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{
                  strokeDasharray: 40, strokeDashoffset: 40,
                  animation: 'splashTick 0.5s ease-out 0.85s forwards',
                }}
              />
            </svg>
          </div>
        </div>

        {/* Wordmark */}
        <p className="font-serif text-white leading-none" style={{
          fontSize: '56px', letterSpacing: '-1px',
          animation: 'splashWordFade 0.6s ease-out 1.1s both',
        }}>
          done
          <span style={{
            display: 'inline-block',
            animation: 'splashDotPop 0.4s cubic-bezier(0.34,1.56,0.64,1) 1.65s both',
          }}>.</span>
        </p>

        {/* Tagline */}
        <p style={{
          fontFamily: '-apple-system,sans-serif', fontSize: '12px',
          color: 'rgba(255,255,255,0.35)', letterSpacing: '0.18em',
          textTransform: 'uppercase', marginTop: '-12px',
          animation: 'splashTagline 0.6s ease-out 1.9s both',
        }}>
          your personal todo
        </p>
      </div>

      {/* Loading bar */}
      <div style={{
        position: 'absolute', bottom: '48px',
        width: '48px', height: '2px',
        background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden',
        animation: 'splashLoaderAppear 0.3s ease-out 1.8s both',
      }}>
        <div style={{
          height: '100%', background: 'rgba(255,255,255,0.7)',
          borderRadius: '2px', width: '0%',
          animation: 'splashLoaderFill 1.4s ease-in-out 2s forwards',
        }}/>
      </div>

      <style>{`
        @keyframes splashGlow      { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.15)} }
        @keyframes splashMarkDrop  { from{opacity:0;transform:scale(.4) translateY(-20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes splashCircle    { from{transform:scale(.6);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes splashTick      { to{stroke-dashoffset:0} }
        @keyframes splashWordFade  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes splashDotPop    { from{opacity:0;transform:scale(0) translateY(4px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes splashTagline   { from{opacity:0} to{opacity:1} }
        @keyframes splashLoaderAppear { from{opacity:0} to{opacity:1} }
        @keyframes splashLoaderFill   { 0%{width:0%} 60%{width:75%} 100%{width:100%} }
      `}</style>
    </div>
  )
}
