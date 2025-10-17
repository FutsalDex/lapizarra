import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'  // Ajusta si globals.css está en src/

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LaPizarra',
  description: 'Herramienta para entrenadores de futsal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
