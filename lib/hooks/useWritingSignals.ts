import { useRef } from 'react'

/**
 * Rastrea due segnali NEUTRALI sul modo in cui un testo è stato prodotto:
 * se è stato incollato un blocco significativo in un colpo, e quanto tempo
 * è passato dalla prima interazione alla consegna. Non è un rilevatore di
 * IA/plagio — è solo informazione che il docente può considerare insieme
 * a tutto il resto che già conosce dello studente (vedi migrazione 0011).
 */
export function useWritingSignals() {
  const primaInterazioneRef = useRef<number | null>(null)
  const incollatoRef = useRef(false)

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const pastedText = e.clipboardData.getData('text')
    // Soglia arbitraria ma ragionevole: pochi caratteri incollati (es. una
    // parola corretta da un correttore ortografico) non è un segnale
    // interessante; un blocco di testo sì.
    if (pastedText.length > 15) {
      incollatoRef.current = true
    }
  }

  function markInterazione() {
    if (primaInterazioneRef.current === null) {
      primaInterazioneRef.current = Date.now()
    }
  }

  function getSegnali(): { testoIncollato: boolean; secondiScrittura: number | null } {
    return {
      testoIncollato: incollatoRef.current,
      secondiScrittura: primaInterazioneRef.current
        ? Math.round((Date.now() - primaInterazioneRef.current) / 1000)
        : null
    }
  }

  return { handlePaste, markInterazione, getSegnali }
}
