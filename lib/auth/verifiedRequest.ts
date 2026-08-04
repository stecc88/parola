import { headers } from 'next/headers'

/**
 * Nome dell'header interno con cui middleware.ts inoltra ai Server
 * Component i dati già verificati per questa richiesta (utente + ruolo +
 * stato). Il middleware lo sovrascrive SEMPRE dopo aver cancellato
 * qualsiasi valore arrivato dal client, quindi un client non può falsificarlo.
 */
export const VERIFIED_HEADER = 'x-parola-verified'

export interface VerifiedAuth {
  userId: string
  role: 'student' | 'teacher' | 'admin' | null
  teacherStatus: string | null
  studentStatus: string | null
  subscriptionEndAt: string | null
}

/**
 * Legge i dati già verificati dal middleware per questa stessa richiesta,
 * per evitare di rifare auth.getUser() + una query su profiles appena
 * eseguite un istante prima. Torna null se l'header manca o è malformato
 * (es. sviluppo locale senza middleware, o un path fuori dal suo matcher):
 * in quel caso chi chiama DEVE rifare il controllo pieno, non fidarsi mai
 * dell'assenza dell'header come "utente non autorizzato".
 */
export function getVerifiedAuth(): VerifiedAuth | null {
  try {
    const raw = headers().get(VERIFIED_HEADER)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<VerifiedAuth>
    if (typeof parsed.userId !== 'string' || !parsed.userId) return null
    return {
      userId: parsed.userId,
      role: parsed.role ?? null,
      teacherStatus: parsed.teacherStatus ?? null,
      studentStatus: parsed.studentStatus ?? null,
      subscriptionEndAt: parsed.subscriptionEndAt ?? null
    }
  } catch {
    return null
  }
}
