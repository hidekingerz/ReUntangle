import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ReUntangle',
  description: 'Visualize and untangle React component dependencies',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
