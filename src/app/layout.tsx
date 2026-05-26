import { ClerkProvider } from '@clerk/nextjs'
// Note: Keep your existing imports here, like fonts and globals.css
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css' 

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ClosetSwap | Premium Inventory Trading',
  description: 'Trade, swap, and sell premium inventory.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // 🚀 Wrapping the entire app in ClerkProvider is the fix!
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.className} bg-background text-foreground`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
} 