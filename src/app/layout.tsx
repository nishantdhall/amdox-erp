import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ServiceWorkerRegistrar } from '@/components/pwa/register-sw'

export const metadata: Metadata = {
  title: {
    default: 'AMDOX ERP — AI-Powered Cloud ERP Suite',
    template: '%s · AMDOX ERP',
  },
  description:
    'Multi-tenant, AI-augmented ERP platform covering finance, HR & payroll, supply chain, projects and demand forecasting.',
  applicationName: 'AMDOX ERP',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'AMDOX ERP', statusBarStyle: 'default' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#4f6ef7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-brand-500 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}
