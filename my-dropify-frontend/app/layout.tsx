import type { Metadata, Viewport } from 'next'
import React from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dropify',
  description: 'Realtime file and text sharing',
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  themeColor: '#0f1117',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: '#0f1117',
          color: '#e6edf3',
          fontFamily: 'Inter, system-ui, sans-serif',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            backdropFilter: 'blur(12px)',
            background: 'rgba(15,17,23,0.6)',
            borderBottom: '1px solid #1f2937',
            padding: '18px 24px',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 600,
              color: '#7aa2f7',
              textShadow: '0 0 15px rgba(122,162,247,0.5)',
            }}
          >
            Dropify
          </h1>
        </header>

        <main style={{ flex: 1 }}>
          {children}
        </main>

        <footer
          style={{
            textAlign: 'center',
            padding: '20px',
            borderTop: '1px solid #1f2937',
            background: 'rgba(15,17,23,0.6)',
            backdropFilter: 'blur(8px)',
            fontSize: '14px',
            color: '#6b7280',
          }}
        >
          © {new Date().getFullYear()} Dropify
        </footer>
      </body>
    </html>
  )
}
