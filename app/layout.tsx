import type { Metadata, Viewport } from 'next'
import './globals.css'

const SITE_URL = 'https://parola-puce.vercel.app'
const TITLE = 'Parola — Italiano per adolescenti'
const DESCRIPTION =
  "Piattaforma di apprendimento dell'italiano per adolescenti: scrittura libera corretta dall'IA, esercizi su misura e monitoraggio dei progressi, pensata per preparare gli studenti a superare standard internazionali di lingua italiana."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: '%s · Parola' },
  description: DESCRIPTION,
  applicationName: 'Parola',
  keywords: [
    'italiano',
    'imparare italiano',
    'lingua italiana',
    'scrittura italiano',
    'esercizi italiano',
    'adolescenti',
    'CEFR',
    'A1 A2 B1 B2 C1 C2'
  ],
  icons: {
    icon: '/favicon.svg'
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: SITE_URL,
    siteName: 'Parola',
    title: TITLE,
    description: DESCRIPTION
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION
  },
  robots: {
    index: true,
    follow: true
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#1A1410' }
  ]
}

// Script inline minimale per applicare il tema scelto (chiaro/scuro/sistema)
// PRIMA del primo paint, evitando il flash del tema sbagliato. Legge solo
// localStorage e matchMedia, nessuna chiamata di rete: sicuro da eseguire
// in modo sincrono nell'head.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('parola-theme');
    var isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
