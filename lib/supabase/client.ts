import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente Supabase para usar en componentes client-side ('use client').
 * Usa la anon key — sujeto a RLS normal, nunca bypassea políticas.
 *
 * flowType: 'implicit' en vez del PKCE por defecto de @supabase/ssr — el
 * flujo PKCE ata el código del link de recuperación al navegador donde
 * se pidió el reset (vía un "code verifier" en localStorage), lo cual
 * rompe el caso más común en la práctica: pedir el reset desde un
 * dispositivo y abrir el link del email desde otro (o desde la app de
 * correo en el celular). El flujo implicit no tiene esa limitación.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit'
      }
    }
  )
}
