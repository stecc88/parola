/**
 * Client minimale per l'invio di email tramite l'API REST di Resend (senza SDK,
 * stesso criterio del client di Gemini: fetch diretto).
 *
 * È deliberatamente OPZIONALE: se RESEND_API_KEY/RESEND_FROM_EMAIL non sono
 * configurate, sendEmail non fa nulla (non lancia errori) — le notifiche
 * email sono un "best effort" sopra la notifica in-app già esistente, non
 * devono mai poter rompere il flusso principale.
 */
export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !from) {
    console.info('Notifica email saltata: RESEND_API_KEY/RESEND_FROM_EMAIL non configurate.')
    return
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from, to, subject, html })
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`Errore inviando email (${res.status}):`, body)
    }
  } catch (err) {
    console.error('Errore di rete inviando email:', err)
  }
}
