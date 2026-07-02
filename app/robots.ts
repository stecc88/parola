import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/student/', '/teacher/', '/admin/', '/account/', '/api/']
    },
    sitemap: 'https://parola-puce.vercel.app/sitemap.xml'
  }
}
