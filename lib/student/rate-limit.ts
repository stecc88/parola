import { createHash } from 'crypto'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Codici Postgres/PostgREST che indicano un errore transitorio di
// infrastruttura (connessione, timeout, restart) — in questi casi
// fail-open è accettabile perché il problema è esterno al codice.
// Tutti gli altri errori (RPC non trovata, permessi sbagliati, bug
// nella funzione) indicano un problema di deploy e vanno fail-closed.
const INFRA_ERROR_CODES = new Set([
  '08000', // connection_exception
  '08003', // connection_does_not_exist
  '08006', // connection_failure
  '57P01', // admin_shutdown
  '57P02', // crash_shutdown
  '57P03', // cannot_connect_now
  'PGRST_DB_ERROR', // PostgREST db-level error (proxy for transient issues)
])

export async function checkSubmissionRateLimit(
  studentId: string,
  { maxPerWindow = 10, windowMinutes = 5 }: { maxPerWindow?: number; windowMinutes?: number } = {}
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.rpc('check_submission_rate_limit_atomic', {
    p_student_id: studentId,
    p_window_minutes: windowMinutes,
    p_max: maxPerWindow
  })

  if (!error) return

  // L'RPC solleva 'rate_limit_exceeded' quando il limite è superato
  if (error.message?.includes('rate_limit_exceeded')) {
    throw new Error('Troppe richieste. Riprova fra qualche minuto.')
  }

  // Errore infrastrutturale (DB irraggiungibile, restart) → fail open
  if (INFRA_ERROR_CODES.has(error.code ?? '')) {
    console.error('[rate-limit] errore infrastrutturale, fail open:', error.code, error.message)
    return
  }

  // Qualsiasi altro errore (RPC non trovata, bug di codice, permessi)
  // → fail closed: blocca la submission e segnala il problema
  console.error('[rate-limit] errore critico, fail closed:', error.code, error.message)
  throw new Error('Errore interno nel controllo limiti. Riprova.')
}

/**
 * Rate limit PRE-autenticazione (login con codice, registrazione studente),
 * chiave = sha-256 dell'IP. Usa il client admin perché l'utente non ha
 * ancora una sessione. Fail-open sugli errori infrastrutturali — un
 * problema del DB non deve bloccare il login a tutti — ma il superamento
 * del limite blocca sempre. (Migrazione 0033.)
 */
export async function checkPreAuthRateLimit(
  { maxPerWindow = 10, windowMinutes = 5 }: { maxPerWindow?: number; windowMinutes?: number } = {}
): Promise<void> {
  const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const keyHash = createHash('sha256').update(ip).digest('hex')

  const admin = createAdminClient()
  const { error } = await admin.rpc('check_login_rate_limit_atomic', {
    p_key_hash: keyHash,
    p_window_minutes: windowMinutes,
    p_max: maxPerWindow
  })

  if (error?.message?.includes('rate_limit_exceeded')) {
    throw new Error('Troppi tentativi. Riprova fra qualche minuto.')
  }
  if (error) {
    console.error('[checkPreAuthRateLimit] errore non bloccante:', error.code, error.message)
  }
}
