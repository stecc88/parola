import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Parola',
  description:
    "Piattaforma di apprendimento dell'italiano per adolescenti, pensata per preparare gli studenti a superare standard internazionali di lingua italiana."
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
