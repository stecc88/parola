/**
 * Cliente minimal de envío de emails vía la API REST de Resend (sin SDK,
 * mismo criterio que el cliente de Gemini: fetch directo).
 *
 * Es deliberadamente OPCIONAL: si RESEND_API_KEY/RESEND_FROM_EMAIL no
 * están configuradas, sendEmail no hace nada (no lanza error) — las
 * notificaciones por email son un "best effort" sobre la notificación
 * in-app ya existente, nunca deben poder romper el flujo principal
 * (que el alumno entregue su ejercicio).
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
