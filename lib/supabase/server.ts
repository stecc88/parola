import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cliente Supabase para Server Components, Server Actions y Route Handlers.
 * Usa la sesión del usuario vía cookies — sujeto a RLS normal, NO bypassea
 * políticas. Para operaciones admin (service role) usar lib/supabase/admin.ts.
 *
 * En Server Components el set/remove son no-op porque Next.js no permite
 * mutar cookies fuera de un Server Action o Route Handler; si esto se usa
 * dentro de uno de esos contextos, el set/remove real funciona normalmente.
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        // Ver nota equivalente en lib/supabase/admin.ts: evita que
        // Next.js cachee las respuestas de las queries vía Data Cache.
        fetch: (url: RequestInfo | URL, options?: RequestInit) =>
          fetch(url, { ...options, cache: 'no-store' })
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // Llamado desde un Server Component: no se puede mutar cookies.
            // El middleware se encarga de refrescar la sesión en ese caso.
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set(name, '', options)
          } catch {
            // Ver nota arriba.
          }
        }
      }
    }
  )
}
