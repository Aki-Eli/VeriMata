import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Baloo_2, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'

const baloo2 = Baloo_2({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'VeriMata - AI Content Detection',
  description: 'Train your AI detection skills with daily quizzes. Learn to spot AI-generated content and misinformation in 5 minutes a day.',
  generator: 'v0.app',
  keywords: ['AI detection', 'misinformation', 'media literacy', 'AI training', 'game'],
    icons: {
    icon: [
      { url: '/logo.jpg', type: 'image/jpeg' },
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/logo.jpg',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f5f6fc',
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`bg-background ${baloo2.variable} ${plusJakarta.variable} ${spaceGrotesk.variable}`}
    >
      <body className="antialiased bg-background text-foreground">
        <AuthProvider>
          {children}
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
