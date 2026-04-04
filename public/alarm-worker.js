// alarm-worker.js — Web Worker timer
// Runs on a separate thread, NOT throttled by browser background tab policy.
// Fires a tick every 5 seconds regardless of tab visibility.
// Main thread listens via worker.onmessage and runs the alarm check.

let timer = null

self.addEventListener('message', (e) => {
  if (e.data === 'start') {
    if (timer) clearInterval(timer)
    // Send first tick immediately so there's no initial delay
    self.postMessage('tick')
    timer = setInterval(() => self.postMessage('tick'), 5000)
  }
  if (e.data === 'stop') {
    if (timer) { clearInterval(timer); timer = null }
  }
})
