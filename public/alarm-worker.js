// alarm-worker.js
// Web Worker — runs on separate thread, never throttled by browser tab policies
// Sends a tick every 5 seconds to trigger alarm checks in the main thread

let timer = null

self.addEventListener('message', (e) => {
  if (e.data === 'start') {
    if (timer) clearInterval(timer)
    self.postMessage('tick')  // immediate first tick
    timer = setInterval(() => self.postMessage('tick'), 5000)
  }
  if (e.data === 'stop') {
    if (timer) { clearInterval(timer); timer = null }
  }
})
