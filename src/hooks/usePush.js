import { useState, useEffect } from 'react'
import { getToken } from '../services/api'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function usePush(user) {
  const [permission,     setPermission]     = useState(() => {
    // Notification API may not exist in all environments
    return typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  })
  const [subscription,   setSubscription]   = useState(null)
  const [swRegistration, setSwRegistration] = useState(null)
  const [testStatus,     setTestStatus]     = useState(null)
  const [subError,       setSubError]       = useState(null)

  const isSupported = typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    typeof Notification !== 'undefined'

  // Register Service Worker and check existing subscription
  useEffect(() => {
    if (!isSupported || !user) return

    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('[SW] Registered:', reg.scope)
        setSwRegistration(reg)
        return reg.pushManager.getSubscription()
      })
      .then(sub => {
        if (sub) {
          console.log('[Push] Existing subscription found')
          setSubscription(sub)
          setPermission('granted')
        } else {
          console.log('[Push] No existing subscription')
        }
      })
      .catch(err => {
        console.error('[SW] Registration failed:', err)
        setSubError(err.message)
      })
  }, [user])

  const requestPermission = async () => {
    setSubError(null)

    if (!isSupported) {
      setSubError('Push notifications are not supported in this browser')
      return
    }

    // Wait for SW to be ready if not yet registered
    let reg = swRegistration
    if (!reg) {
      try {
        reg = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready
        setSwRegistration(reg)
        console.log('[SW] Registered on demand')
      } catch (err) {
        console.error('[SW] Failed to register:', err)
        setSubError('Service Worker registration failed: ' + err.message)
        return
      }
    }

    // Wait for SW to be fully active
    await navigator.serviceWorker.ready

    try {
      // Ask permission
      console.log('[Push] Requesting notification permission...')
      const result = await Notification.requestPermission()
      console.log('[Push] Permission result:', result)
      setPermission(result)

      if (result !== 'granted') {
        setSubError('Notification permission was denied. Please enable it in browser settings.')
        return
      }

      // Get VAPID public key from Flask
      console.log('[Push] Fetching VAPID public key...')
      const res  = await fetch(`${BASE_URL}/api/push/vapid-public-key`)
      const data = await res.json()
      console.log('[Push] VAPID key response:', data)

      if (!data.publicKey) {
        setSubError('Server push not configured — VAPID key missing')
        return
      }

      const pubKey = urlBase64ToUint8Array(data.publicKey)

      // Subscribe browser to push
      console.log('[Push] Subscribing browser...')
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: pubKey,
      })
      console.log('[Push] Browser subscription created:', sub.endpoint.slice(0, 60) + '...')
      setSubscription(sub)

      // Save subscription to Flask DB
      const token = getToken()
      const saveRes = await fetch(`${BASE_URL}/api/push/subscribe`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(sub.toJSON()),
      })
      const saveData = await saveRes.json()
      console.log('[Push] Saved to server:', saveData)

      if (!saveRes.ok) throw new Error(saveData.error || 'Failed to save subscription')

      console.log('[Push] ✅ Push notifications fully set up!')

    } catch (err) {
      console.error('[Push] Setup failed:', err)
      setSubError(err.message)
    }
  }

  const unsubscribe = async () => {
    if (!subscription) return
    try {
      const token = getToken()
      await fetch(`${BASE_URL}/api/push/unsubscribe`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({ endpoint: subscription.endpoint }),
      })
      await subscription.unsubscribe()
      setSubscription(null)
      setPermission('default')
    } catch (err) { console.error('[Push] Unsubscribe failed:', err) }
  }

  const sendTestPush = async () => {
    setTestStatus('sending')
    try {
      // First check status
      const token   = getToken()
      const statRes = await fetch(`${BASE_URL}/api/push/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const statData = await statRes.json()
      console.log('[Push] Status before test:', statData)

      if (statData.subscriptionCount === 0) {
        console.warn('[Push] No subscriptions saved — re-subscribing...')
        await requestPermission()
      }

      const res  = await fetch(`${BASE_URL}/api/push/test`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      })
      const data = await res.json()
      console.log('[Push] Test result:', data)

      if (!res.ok) throw new Error(data.error || 'Test failed')
      setTestStatus('sent')
      setTimeout(() => setTestStatus(null), 3000)
    } catch (err) {
      console.error('[Push] Test failed:', err)
      setTestStatus('error')
      setTimeout(() => setTestStatus(null), 3000)
    }
  }

  // Direct browser notification — no server involved, tests if browser will show notifs at all
  const sendDirectTest = () => {
    if (Notification.permission !== 'granted') return
    new Notification('done. — direct test ✅', {
      body: 'If you see this, browser notifications work! Push via server should also work.',
      icon: '/favicon.svg',
    })
  }

  return {
    permission, subscription, isSupported,
    subError,
    requestPermission, unsubscribe,
    sendTestPush, testStatus,
    sendDirectTest,
  }
}
