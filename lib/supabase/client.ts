import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente Supabase para usar en componentes client-side ('use client').
 * Usa la anon key — sujeto a RLS normal, nunca bypassea políticas.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
