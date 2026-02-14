import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Dropify',
  description: 'Realtime file and text sharing',
  manifest: '/manifest.webmanifest',
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head />
      <body>
        <header>
          <h1>Dropify</h1>
        </header>

        <main>{children}</main>

        <footer>
          <p>© Dropify</p>
        </footer>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
