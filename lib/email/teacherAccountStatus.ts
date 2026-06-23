import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from './send'

/**
 * Notifica al docente quando il suo account viene approvato o rifiutato
 * dall'amministratore — senza questo, l'unico modo per saperlo era
 * continuare a riprovare il login manualmente. Best-effort come tutte le
 * notifiche email: un fallimento qui non deve mai bloccare l'azione
 * dell'amministratore.
 */
export async function notifyTeacherAccountStatus({
  teacherId,
  esito
}: {
  teacherId: string
  esito: 'approved' | 'rejected'
}): Promise<void> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.getUserById(teacherId)
    const email = data?.user?.email
    if (error || !email) return

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://parola-puce.vercel.app'

    if (esito === 'approved') {
      await sendEmail({
        to: email,
        subject: 'Il tuo account insegnante su Parola è stato approvato',
        html: `
          <p>Ciao,</p>
          <p>Il tuo account insegnante su Parola è stato <strong>approvato</strong>.
          Puoi accedere e iniziare a creare le tue classi.</p>
          <p><a href="${siteUrl}/login">Accedi a Parola</a></p>
        `
      })
    } else {
      await sendEmail({
        to: email,
        subject: 'Aggiornamento sul tuo account insegnante su Parola',
        html: `
          <p>Ciao,</p>
          <p>La tua richiesta di account insegnante su Parola non è stata approvata
          in questo momento. Se pensi sia un errore, contatta l'amministratore della
          piattaforma.</p>
        `
      })
    }
  } catch (err) {
    console.error('Errore notificando lo stato account al docente:', err)
  }
}
