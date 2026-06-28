'use client'

import { Button } from '@/components/ui/Button'
import type { StudentStats } from '@/lib/analytics/studentStats'

interface Props {
  nomeCompleto: string
  livelloTarget: string | null
  stats: StudentStats
  ultimoAccesso: string | null
}

/**
 * Genera un report PDF semplice (testo, niente grafici) lato client con
 * jsPDF — pensato per essere consegnato/condiviso ai genitori o usato come
 * riferimento in un colloquio scuola-famiglia. Tutta la generazione
 * avviene nel browser: nessuna chiamata al server, nessun dato che esce
 * dalla macchina del docente oltre al normale caricamento della pagina.
 */
export function ExportReportButton({ nomeCompleto, livelloTarget, stats, ultimoAccesso }: Props) {
  async function handleExport() {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const margin = 18
    let y = margin

    function riga(testo: string, opzioni: { size?: number; bold?: boolean; gap?: number } = {}) {
      doc.setFontSize(opzioni.size ?? 11)
      doc.setFont('helvetica', opzioni.bold ? 'bold' : 'normal')
      const righe = doc.splitTextToSize(testo, 180)
      doc.text(righe, margin, y)
      y += righe.length * (opzioni.size ?? 11) * 0.45 + (opzioni.gap ?? 4)
    }

    riga('Parola — Report studente', { size: 18, bold: true, gap: 2 })
    riga(`Generato il ${new Date().toLocaleDateString('it-IT')}`, { size: 9, gap: 8 })

    riga(nomeCompleto, { size: 14, bold: true, gap: 2 })
    riga(
      `Livello target: ${livelloTarget ?? 'non specificato'}    ·    Ultimo accesso: ${
        ultimoAccesso
          ? new Date(ultimoAccesso).toLocaleDateString('it-IT')
          : 'mai'
      }`,
      { size: 10, gap: 8 }
    )

    riga('Riepilogo', { size: 13, bold: true, gap: 3 })
    riga(`Attività totali: ${stats.totaleAttivita}`)
    riga(`Punteggio medio: ${stats.mediaGenerale !== null ? `${stats.mediaGenerale}%` : '—'}`)
    riga(
      `Livello stimato attuale: ${stats.livelloAttuale ?? '—'}${
        stats.livelloPrecedente && stats.livelloPrecedente !== stats.livelloAttuale
          ? ` (prima: ${stats.livelloPrecedente})`
          : ''
      }`
    )
    riga(
      `Consegne rispettate: ${
        stats.consegna.percentuale !== null ? `${stats.consegna.percentuale}%` : '—'
      } (${stats.consegna.rispettate}/${stats.consegna.totali})`,
      { gap: 8 }
    )

    riga('Punti di forza ricorrenti', { size: 13, bold: true, gap: 3 })
    if (stats.puntiForzaFrequenti.length === 0) {
      riga('Nessun dato ancora disponibile.', { gap: 8 })
    } else {
      for (const p of stats.puntiForzaFrequenti) {
        riga(`• ${p.testo}${p.conteggio > 1 ? ` (×${p.conteggio})` : ''}`)
      }
      y += 4
    }

    riga('Aree di miglioramento ricorrenti', { size: 13, bold: true, gap: 3 })
    if (stats.areeMiglioramentoFrequenti.length === 0) {
      riga('Nessun dato ancora disponibile.', { gap: 8 })
    } else {
      for (const a of stats.areeMiglioramentoFrequenti) {
        riga(`• ${a.testo}${a.conteggio > 1 ? ` (×${a.conteggio})` : ''}`)
      }
      y += 4
    }

    riga('Punti deboli e temi da rinforzare', { size: 13, bold: true, gap: 3 })
    const categorie = Object.entries(stats.erroriPerCategoria)
      .filter(([, n]) => n > 0)
      .sort(([, a], [, b]) => b - a)
    const totaleErrori = categorie.reduce((acc, [, n]) => acc + n, 0)
    if (totaleErrori === 0) {
      riga('Nessun errore registrato nelle attività valutate finora — ottimo!', { gap: 8 })
    } else {
      for (const [categoria, conteggio] of categorie) {
        riga(`${categoria.charAt(0).toUpperCase() + categoria.slice(1)}: ${conteggio} errori`, { bold: true, gap: 2 })
        const dettagli = stats.erroriDettagliatiPerCategoria[categoria as keyof typeof stats.erroriDettagliatiPerCategoria] ?? []
        if (dettagli.length > 0) {
          for (const d of dettagli) {
            riga(`  › ${d.testo}${d.conteggio > 1 ? ` (×${d.conteggio})` : ''}`, { gap: 2 })
          }
        }
        y += 3
      }

      // Raccomandazione sintetica sul punto più debole
      const peggiore = categorie[0]
      if (peggiore) {
        y += 2
        riga(
          `Priorità consigliata: l'area con più errori è "${peggiore[0]}" (${peggiore[1]} errori). Si consiglia di proporre esercizi mirati su questo tema prima di procedere con argomenti nuovi.`,
          { size: 10, gap: 8 }
        )
      }
    }

    riga(
      'Le valutazioni sono generate da un sistema di intelligenza artificiale come supporto didattico, non come certificazione ufficiale di livello linguistico.',
      { size: 8, gap: 0 }
    )

    const nomeFile = `report-${nomeCompleto.toLowerCase().replace(/\s+/g, '-')}.pdf`
    doc.save(nomeFile)
  }

  return (
    <Button variant="secondary" onClick={handleExport} className="text-sm">
      📄 Esporta report PDF
    </Button>
  )
}
