import { createBrowserClient } from '@supabase/ssr'

/**
 * Client Supabase da usare nei componenti client-side ('use client').
 * Usa la anon key — soggetto alla RLS normale, non bypassa mai le policy.
 *
 * flowType: 'implicit' invece del PKCE predefinito di @supabase/ssr — il
 * flusso PKCE lega il codice del link di recupero al browser dove è stato
 * richiesto il reset (tramite un "code verifier" in localStorage), il che
 * rompe il caso più comune nella pratica: richiedere il reset da un
 * dispositivo e aprire il link dell'email da un altro (o dall'app di posta
 * sullo smartphone). Il flusso implicit non ha questa limitazione.
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
