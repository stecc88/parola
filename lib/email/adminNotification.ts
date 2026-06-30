import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from './send'

export async function notifyAdminOfNameChangeRequest({
  nomeAttuale,
  cognomeAttuale,
  nomeRichiesto,
  cognomeRichiesto
}: {
  nomeAttuale: string
  cognomeAttuale: string
  nomeRichiesto: string
  cognomeRichiesto: string
}): Promise<void> {
  try {
    const admin = createAdminClient()
    const { data: admins } = await admin
      .from('profiles')
      .select('email')
      .eq('role', 'admin')

    if (!admins?.length) return

    const emails = admins.map((a) => a.email).filter((e): e is string => !!e)
    if (!emails.length) return

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    const linkAdmin = siteUrl ? `<p><a href="${siteUrl}/admin/users">Vai alla gestione utenti</a></p>` : ''

    for (const email of emails) {
      await sendEmail({
        to: email,
        subject: 'Nuova richiesta di cambio nome su Parola',
        html: `
          <p>Ciao,</p>
          <p>Un utente ha richiesto il cambio di nome su Parola.</p>
          <table style="border-collapse:collapse;font-size:14px;margin:12px 0;">
            <tr>
              <td style="padding:4px 12px 4px 0;color:#8A7C6D;">Nome attuale</td>
              <td style="padding:4px 0;"><strong>${nomeAttuale} ${cognomeAttuale}</strong></td>
            </tr>
            <tr>
              <td style="padding:4px 12px 4px 0;color:#8A7C6D;">Nome richiesto</td>
              <td style="padding:4px 0;"><strong>${nomeRichiesto} ${cognomeRichiesto}</strong></td>
            </tr>
          </table>
          ${linkAdmin}
          <p style="color:#8A7C6D;font-size:12px;margin-top:24px;">
            Notifica automatica di Parola.
          </p>
        `
      })
    }
  } catch (err) {
    console.error('Errore notificando l\'admin del cambio nome:', err)
  }
}
