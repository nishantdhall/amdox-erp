'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker that backs offline read views (F-12).
 * Registration is best-effort — a failure must never break the app shell.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        /* offline support is an enhancement; ignore registration failures */
      })
    }
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
  }, [])

  return null
}
