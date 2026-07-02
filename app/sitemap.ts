import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://parola-puce.vercel.app'
  return ['', '/privacy', '/termini', '/login', '/registrati', '/accesso-studente'].map(
    (path) => ({
      url: `${base}${path}`,
      changeFrequency: 'monthly' as const,
      priority: path === '' ? 1 : 0.5
    })
  )
}
