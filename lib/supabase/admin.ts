import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Client con Service Role Key — bypassa RLS completamente.
 *
 * REGOLA CRITICA: non importare mai questo modulo da codice che può
 * finire in un bundle client (componenti 'use client', hooks, ecc.).
 * Usare solo dentro:
 *   - Route Handlers (app/api/.../route.ts)
 *   - Server Actions ('use server')
 *   - Server Components che NON passano il risultato grezzo al client
 *
 * Non esportare un singleton a livello di modulo importabile da qualsiasi
 * parte: esposto solo tramite createAdminClient(), che verifica che
 * SUPABASE_SERVICE_ROLE_KEY esista solo in runtime server.
 */

let cachedClient: SupabaseClient | null = null

export function createAdminClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error(
      'createAdminClient() invocato nel browser. ' +
        'Questo client usa la service role key e NON deve mai girare client-side.'
    )
  }

  if (cachedClient) return cachedClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Mancano NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY nelle variabili d\'ambiente del server.'
    )
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      // CRITICO: Next.js mette automaticamente in cache le chiamate fetch()
      // fatte server-side (Data Cache). Il client Supabase usa fetch
      // internamente per ogni query — senza cache: 'no-store', una query
      // (es. "è admin?") può restituire dati obsoleti anche se la DB è cambiata.
      fetch: (url: RequestInfo | URL, options?: RequestInit) =>
        fetch(url, { ...options, cache: 'no-store' })
    }
  })

  return cachedClient
}

/**
 * Verifica che l'utente della sessione corrente abbia role === 'admin'
 * prima di permettere qualsiasi operazione admin. Va chiamata all'inizio
 * di ogni endpoint che usa createAdminClient() per mutazioni sensibili.
 *
 * Lancia un'eccezione se non è admin; chi chiama decide come tradurla
 * in una risposta HTTP (401/403).
 */
export async function assertIsAdmin(userId: string | undefined): Promise<void> {
  if (!userId) {
    throw new Error('UNAUTHENTICATED')
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data || data.role !== 'admin') {
    // Log dettagliato server-side: il messaggio visto dal client è sempre
    // generico ('FORBIDDEN_NOT_ADMIN'), ma qui rimane la causa reale
    // (es. service role key invalida, riga non trovata, ruolo diverso).
    console.error('assertIsAdmin fallita:', {
      userId,
      error: error?.message,
      errorDetails: error,
      dataFound: !!data,
      role: data?.role
    })
    throw new Error('FORBIDDEN_NOT_ADMIN')
  }
}
