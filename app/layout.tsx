import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Syne } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
})

export const metadata: Metadata = {
  title: 'PataFamília',
  description: 'Gerencie os cuidados dos seus pets com toda a família',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${plusJakarta.variable} ${syne.variable} font-jakarta antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
