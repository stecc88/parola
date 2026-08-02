'use client'

import { Button } from '@/components/ui/Button'
import { classifyTrend, type StudentStats } from '@/lib/analytics/studentStats'
import type { jsPDF } from 'jspdf'

interface Props {
  nomeCompleto: string
  livelloTarget: string | null
  stats: StudentStats
  ultimoAccesso: string | null
}

// Stessi colori usati altrove nell'app per le categorie di errore (vedi
// bg-info-bg/bg-guided-bg/ecc. nella UI) tradotti in RGB per il PDF, dove
// le CSS custom properties non sono disponibili.
const CATEGORIA_COLORE: Record<string, [number, number, number]> = {
  grammatica: [129, 140, 248],
  lessico: [52, 211, 153],
  sintassi: [251, 191, 36],
  coerenza: [244, 114, 182],
  ortografia: [248, 113, 113]
}

/**
 * Disegna un grafico a torta della distribuzione errori per categoria +
 * legenda, senza dipendenze esterne (jsPDF non supporta archi nativi: si
 * approssima ogni fetta con un ventaglio di triangoli pieni, stesso
 * approccio "niente libreria di charting" già usato per EvolutionChart in
 * SVG sul web). Pensato per un colpo d'occhio in un colloquio
 * scuola-famiglia — la lista testuale dettagliata resta sotto, invariata,
 * per chi vuole il dettaglio.
 */
function disegnaGraficoATorta(
  doc: jsPDF,
  dati: Array<[string, number]>,
  totale: number,
  x: number,
  yTop: number
): number {
  const cx = x + 20
  const cy = yTop + 20
  const r = 18
  let angoloCorrente = -90 // parte dall'alto, come le torte convenzionali

  for (const [categoria, conteggio] of dati) {
    const gradi = (conteggio / totale) * 360
    const colore = CATEGORIA_COLORE[categoria] ?? [180, 180, 180]
    doc.setFillColor(...colore)
    // Ventaglio di triangoli sottili (uno ogni ~3°): abbastanza fitto da
    // sembrare un arco continuo alla risoluzione di stampa.
    const passi = Math.max(1, Math.ceil(gradi / 3))
    for (let i = 0; i < passi; i++) {
      const a1 = ((angoloCorrente + (gradi * i) / passi) * Math.PI) / 180
      const a2 = ((angoloCorrente + (gradi * (i + 1)) / passi) * Math.PI) / 180
      doc.triangle(
        cx,
        cy,
        cx + r * Math.cos(a1),
        cy + r * Math.sin(a1),
        cx + r * Math.cos(a2),
        cy + r * Math.sin(a2),
        'F'
      )
    }
    angoloCorrente += gradi
  }

  // Legenda a destra della torta
  let ly = yTop + 2
  const lx = x + 46
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(30, 30, 30)
  for (const [categoria, conteggio] of dati) {
    const colore = CATEGORIA_COLORE[categoria] ?? [180, 180, 180]
    const percentuale = Math.round((conteggio / totale) * 100)
    doc.setFillColor(...colore)
    doc.rect(lx, ly - 3, 3.5, 3.5, 'F')
    doc.text(
      `${categoria.charAt(0).toUpperCase() + categoria.slice(1)} — ${conteggio} (${percentuale}%)`,
      lx + 5.5,
      ly
    )
    ly += 6
  }
  doc.setTextColor(0, 0, 0)

  return yTop + 44
}

// Spiega IN COSA AIUTA lavorare su ogni categoria — non solo "hai N errori
// qui", ma perché quel tipo di errore incide sulla qualità del testo.
// Scritto per essere letto anche da chi non insegna italiano (i genitori
// in un colloquio scuola-famiglia), non solo dal docente.
const CATEGORIA_PERCHE_CONTA: Record<string, string> = {
  grammatica:
    "la grammatica è l'impalcatura che rende un testo comprensibile: anche quando le idee sono buone, errori grammaticali frequenti costringono chi legge a fare uno sforzo in più per capirle.",
  lessico:
    'un vocabolario più ricco e preciso permette di dire esattamente quello che si vuole dire, evitando ripetizioni — è spesso ciò che distingue un testo corretto da un testo che si legge bene.',
  sintassi:
    'la sintassi è il modo in cui le frasi si collegano tra loro: lavorarci rende un testo scorrevole invece di una sequenza di frasi brevi e isolate.',
  coerenza:
    'la coerenza tiene insieme le idee in un percorso logico chiaro dall\'inizio alla fine: è spesso l\'ultimo tassello, quello che trasforma un buon testo in un testo davvero efficace.',
  ortografia:
    "l'ortografia è la prima cosa che chi legge nota: pochi errori bastano per dare un'impressione di distrazione, anche quando il contenuto è valido."
}

/**
 * Costruisce la restituzione pedagogica finale: non un'altra lista di
 * numeri, ma una lettura di quei numeri — pensata per motivare lo
 * studente (che potrebbe leggere questo report insieme ai genitori) e
 * dare al docente un consiglio operativo concreto, ancorato a funzioni
 * che esistono già nell'app (non un generico "esercitati di più").
 */
function costruisciSintesiEConsigli(
  stats: StudentStats,
  nomeCompleto: string,
  categoriePeggiori: Array<[string, number]>
): string[] {
  const primoNome = nomeCompleto.trim().split(/\s+/)[0] || nomeCompleto
  const trend = classifyTrend(stats.evoluzione)
  const paragrafi: string[] = []

  switch (trend) {
    case 'miglioramento':
      paragrafi.push(
        `I punteggi più recenti sono più alti di quelli delle prime attività: è un miglioramento reale, non un caso isolato. Vale la pena dirlo esplicitamente a ${primoNome} — i progressi graduali sono spesso meno visibili allo studente stesso di quanto lo siano nei dati.`
      )
      break
    case 'calo':
      paragrafi.push(
        `Negli ultimi testi il punteggio medio è più basso rispetto alle prime attività. Non significa necessariamente un passo indietro: può indicare testi più impegnativi, un periodo di minore concentrazione, o la normale oscillazione tra una prova e l'altra. Prima di trarre conclusioni, vale la pena parlarne con ${primoNome} per capirne la causa insieme.`
      )
      break
    case 'stabile':
      paragrafi.push(
        `Il punteggio si mantiene stabile nel tempo. Una fase di stabilità non è un rallentamento: spesso è il momento in cui le competenze si consolidano, prima di manifestarsi in un punteggio più alto.`
      )
      break
    default:
      paragrafi.push(
        `Ci sono ancora poche attività valutate per parlare di un andamento nel tempo — continuando a esercitarsi, questo report diventerà più informativo con ogni nuova attività.`
      )
  }

  if (stats.mediaSessioniPerSettimana !== null) {
    if (stats.mediaSessioniPerSettimana >= 2) {
      paragrafi.push(
        `La costanza è un punto di forza: in media ${stats.mediaSessioniPerSettimana} attività a settimana. La regolarità conta più dell'intensità — poche attività fatte spesso valgono più di molte concentrate in un solo giorno.`
      )
    } else {
      paragrafi.push(
        `La frequenza attuale è di circa ${stats.mediaSessioniPerSettimana} attività a settimana: anche un piccolo aumento, con sessioni brevi ma regolari, aiuterebbe a consolidare più velocemente quanto già acquisito.`
      )
    }
  }

  const peggiore = categoriePeggiori[0]
  if (peggiore) {
    const spiegazione =
      CATEGORIA_PERCHE_CONTA[peggiore[0]] ?? 'è l\'area con più errori tra quelle registrate finora.'
    const categoriaLabel = peggiore[0].charAt(0).toUpperCase() + peggiore[0].slice(1)
    paragrafi.push(
      `Perché lavorare su "${categoriaLabel}": ${spiegazione} Un modo concreto per intervenire: generare da questa pagina un esercizio personalizzato mirato su questo tema (pulsante "Genera esercizio personalizzato" più in alto), invece di esercizi generici.`
    )
  }

  paragrafi.push(
    `A ${primoNome}: l'obiettivo non è scrivere senza errori da subito, ma capire perché succedono — è così che si smette di ripeterli. Ogni testo corretto è un'occasione per imparare qualcosa di specifico, non solo un punteggio.`
  )

  return paragrafi
}

/**
 * Genera un report PDF lato client con jsPDF — pensato per essere
 * consegnato/condiviso ai genitori o usato come riferimento in un
 * colloquio scuola-famiglia. Tutta la generazione avviene nel browser:
 * nessuna chiamata al server, nessun dato che esce dalla macchina del
 * docente oltre al normale caricamento della pagina.
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
      const altezza = righe.length * (opzioni.size ?? 11) * 0.45
      // Il report è cresciuto (grafico + sintesi pedagogica): senza questo
      // controllo il testo continuava a scrivere oltre il fondo pagina.
      if (y + altezza > 270) {
        doc.addPage()
        y = margin
      }
      doc.text(righe, margin, y)
      y += altezza + (opzioni.gap ?? 4)
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
      if (y + 44 > 280) {
        doc.addPage()
        y = margin
      }
      y = disegnaGraficoATorta(doc, categorie, totaleErrori, margin, y)

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

    riga('Sintesi e consigli', { size: 13, bold: true, gap: 3 })
    for (const paragrafo of costruisciSintesiEConsigli(stats, nomeCompleto, categorie)) {
      riga(paragrafo, { size: 10, gap: 6 })
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
