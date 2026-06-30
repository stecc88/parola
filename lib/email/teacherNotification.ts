import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from './send'

/**
 * Notifica il docente via email quando uno studente consegna un esercizio
 * personalizzato — complemento della notifica in-app già esistente
 * (seen_by_teacher), non un sostituto. Sempre "best effort": qualsiasi
 * errore (email non configurata, errore di rete, email del docente non
 * recuperabile) viene loggato e ignorato, non deve mai bloccare la
 * consegna dello studente.
 */
export async function notifyTeacherOfDelivery({
  teacherId,
  nomeStudente,
  titoloEsercizio,
  studentId
}: {
  teacherId: string
  nomeStudente: string
  titoloEsercizio: string
  studentId: string
}): Promise<void> {
  try {
    const admin = createAdminClient()
    const { data: profile, error } = await admin
      .from('profiles')
      .select('email')
      .eq('id', teacherId)
      .single()
    const email = profile?.email

    if (error || !email) {
      console.error('Notifica email: impossibile recuperare l\'email del docente.', error)
      return
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!siteUrl) {
      console.error('teacherNotification: NEXT_PUBLIC_SITE_URL non configurata — il link nel email sarà vuoto.')
    }

    await sendEmail({
      to: email,
      subject: `${nomeStudente} ha consegnato un esercizio su Parola`,
      html: `
        <p>Ciao,</p>
        <p><strong>${nomeStudente}</strong> ha appena consegnato la risposta a
        "<strong>${titoloEsercizio}</strong>".</p>
        ${siteUrl ? `<p><a href="${siteUrl}/teacher/students/${studentId}">Vai alla pagina dello studente</a></p>` : ''}
        <p style="color:#8A7C6D;font-size:12px;margin-top:24px;">
          Questa è una notifica automatica di Parola. Puoi vedere tutte le consegne in attesa
          anche direttamente in piattaforma, sotto "Nuove consegne".
        </p>
      `
    })
  } catch (err) {
    console.error('Errore inatteso notificando il docente:', err)
  }
}
