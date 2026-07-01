'use client'

import { Button } from '@/components/ui/Button'

interface SubmissionExport {
  tipo: string
  data: string
  testo: string
  valutazione_ia: Record<string, unknown> | null
}

interface Props {
  nomeCompleto: string
  submissions: SubmissionExport[]
}

export function ExportCorrezioniButton({ nomeCompleto, submissions }: Props) {
  const valutate = submissions.filter(
    (s) => s.valutazione_ia && typeof s.valutazione_ia === 'object'
  )

  async function handleExport() {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const W = 174
    let y = 18

    function riga(
      testo: string,
      opts: { size?: number; bold?: boolean; gap?: number; colore?: [number, number, number] } = {}
    ) {
      doc.setFontSize(opts.size ?? 11)
      doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
      if (opts.colore) doc.setTextColor(...opts.colore)
      else doc.setTextColor(30, 30, 30)
      const lines = doc.splitTextToSize(testo, W)
      if (y + lines.length * (opts.size ?? 11) * 0.45 > 270) {
        doc.addPage()
        y = 18
      }
      doc.text(lines, 18, y)
      y += lines.length * (opts.size ?? 11) * 0.45 + (opts.gap ?? 4)
    }

    function separatore(spessore = false) {
      doc.setDrawColor(spessore ? 80 : 200, spessore ? 80 : 200, spessore ? 80 : 200)
      doc.setLineWidth(spessore ? 0.5 : 0.2)
      doc.line(18, y, 192, y)
      y += 5
    }

    // Cover
    riga('Parola — Raccolta correzioni', { size: 18, bold: true, gap: 2 })
    riga(`Generato il ${new Date().toLocaleDateString('it-IT')}`, { size: 9, gap: 6 })
    riga(nomeCompleto, { size: 14, bold: true, gap: 2 })
    riga(`${valutate.length} testi valutati su ${submissions.length} attività totali`, {
      size: 10,
      gap: 10
    })
    separatore(true)

    for (let i = 0; i < valutate.length; i++) {
      const s = valutate[i]
      const v = s.valutazione_ia!

      const punteggio =
        typeof v.punteggio_complessivo === 'number'
          ? v.punteggio_complessivo
          : typeof v.punteggio === 'number'
            ? v.punteggio
            : null

      const feedbackGenerale = typeof v.feedback_generale === 'string' ? v.feedback_generale : null
      const puntiForza = Array.isArray(v.punti_forza) ? (v.punti_forza as string[]) : []
      const areeMiglioramento = Array.isArray(v.aree_di_miglioramento)
        ? (v.aree_di_miglioramento as string[])
        : []
      const errori = Array.isArray(v.errori)
        ? (v.errori as Array<{
            testo_originale: string
            correzione: string
            categoria: string
            spiegazione: string
          }>)
        : []
      const rc = v.rispetto_consegna as { rispetta_consegna?: boolean; note?: string } | null

      // Intestazione testo
      riga(`Testo ${i + 1} di ${valutate.length}`, { size: 12, bold: true, gap: 2 })
      riga(
        `${s.tipo}  ·  ${s.data}${punteggio !== null ? `  ·  Punteggio: ${punteggio}%` : ''}`,
        { size: 10, gap: 5 }
      )

      riga('Testo dello studente', { size: 10, bold: true, gap: 2 })
      riga(s.testo, { size: 10, gap: 6 })

      if (feedbackGenerale) {
        riga('Feedback', { size: 10, bold: true, gap: 2 })
        riga(feedbackGenerale, { size: 10, gap: 4 })
      }

      if (puntiForza.length > 0) {
        riga('Punti di forza', { size: 10, bold: true, gap: 2 })
        for (const p of puntiForza) riga(`• ${p}`, { size: 10, gap: 1.5 })
        y += 2
      }

      if (areeMiglioramento.length > 0) {
        riga('Aree da lavorare', { size: 10, bold: true, gap: 2 })
        for (const a of areeMiglioramento) riga(`• ${a}`, { size: 10, gap: 1.5 })
        y += 2
      }

      if (errori.length > 0) {
        riga(`Correzioni (${errori.length} errori)`, { size: 10, bold: true, gap: 2 })
        for (const e of errori) {
          riga(`${e.testo_originale}  →  ${e.correzione}`, { size: 9, bold: true, gap: 1 })
          riga(`[${e.categoria}] ${e.spiegazione}`, {
            size: 9,
            gap: 3,
            colore: [100, 100, 100]
          })
        }
      }

      if (rc) {
        riga(
          `Consegna: ${rc.rispetta_consegna ? 'rispettata ✓' : 'non completamente rispettata ⚠'}${rc.note ? ' — ' + rc.note : ''}`,
          { size: 9, gap: 4, colore: [100, 100, 100] }
        )
      }

      if (i < valutate.length - 1) {
        y += 3
        separatore(true)
      }
    }

    y += 6
    separatore()
    riga(
      'Le valutazioni sono generate da un sistema di intelligenza artificiale come supporto didattico, non come certificazione ufficiale di livello linguistico.',
      { size: 8, gap: 0, colore: [150, 150, 150] }
    )

    const nomeFile = `correzioni-${nomeCompleto.toLowerCase().replace(/\s+/g, '-')}.pdf`
    doc.save(nomeFile)
  }

  if (valutate.length === 0) return null

  return (
    <Button variant="secondary" onClick={handleExport} className="text-sm">
      ↓ Scarica tutte le correzioni ({valutate.length})
    </Button>
  )
}
