import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from './send'

/**
 * Notifica al docente por email cuando un alumno entrega un ejercicio
 * personalizado — complemento de la notificación in-app ya existente
 * (seen_by_teacher), no un sustituto. Siempre "best effort": cualquier
 * fallo (email no configurado, error de red, docente sin email
 * recuperable) se loguea y se ignora, nunca debe hacer fallar la
 * entrega del alumno.
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
    const { data, error } = await admin.auth.admin.getUserById(teacherId)
    const email = data?.user?.email

    if (error || !email) {
      console.error('Notifica email: impossibile recuperare l\'email del docente.', error)
      return
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://parola-puce.vercel.app'

    await sendEmail({
      to: email,
      subject: `${nomeStudente} ha consegnato un esercizio su Parola`,
      html: `
        <p>Ciao,</p>
        <p><strong>${nomeStudente}</strong> ha appena consegnato la risposta a
        "<strong>${titoloEsercizio}</strong>".</p>
        <p><a href="${siteUrl}/teacher/students/${studentId}">Vai alla pagina dello studente</a></p>
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
