import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'AMDOX ERP — AI-Powered Cloud ERP Suite',
  description: 'AI-powered enterprise resource planning for modern businesses. Manage finance, HR, supply chain, and more.',
  keywords: ['ERP', 'AI', 'Finance', 'HR', 'Supply Chain', 'Cloud'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#f4f6fb] antialiased" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
