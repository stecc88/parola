import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Client Supabase per Server Components, Server Actions e Route Handlers.
 * Usa la sessione dell'utente tramite cookie — soggetto alla RLS normale,
 * NON bypassa le policy. Per operazioni admin (service role) usare lib/supabase/admin.ts.
 *
 * Nei Server Components set/remove sono no-op perché Next.js non permette
 * di mutare i cookie fuori da un Server Action o Route Handler; se questo
 * viene usato dentro uno di quei contesti, set/remove funziona normalmente.
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        // Vedi nota equivalente in lib/supabase/admin.ts: evita che
        // Next.js metta in cache le risposte delle query via Data Cache.
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
            // Chiamato da un Server Component: non si possono mutare cookies.
            // Il middleware si occupa di aggiornare la sessione in quel caso.
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set(name, '', options)
          } catch {
            // Vedi nota sopra.
          }
        }
      }
    }
  )
}
