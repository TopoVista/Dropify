export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>
          <h1>Dropify</h1>
        </header>

        <main>{children}</main>

        <footer>
          <p>© Dropify</p>
        </footer>
      </body>
    </html>
  )
}
