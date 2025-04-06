import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BlindLearn',
  description: 'Created in Next.js 13.4.4 with TypeScript',
  // generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
