'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function InviteCodeActions({ code }: { code: string }) {
  const [copiato, setCopiato] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopiato(true)
      setTimeout(() => setCopiato(false), 2000)
    } catch {
      // Clipboard non disponibile (es. http non sicuro): nessun problema
      // critico, l'utente può comunque selezionare il testo a mano.
    }
  }

  const messaggioWhatsApp = encodeURIComponent(
    `Ciao! Per unirti alla mia classe su Parola, registrati su https://parola-puce.vercel.app/registrati e inserisci questo codice insegnante: ${code}`
  )

  return (
    <div className="mt-2 flex gap-2">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-md bg-surface px-3 py-1.5 text-xs font-medium text-guided-text transition-colors hover:bg-surface-tertiary"
      >
        {copiato ? (
          <>
            <Check className="h-3.5 w-3.5" /> Copiato!
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" /> Copia codice
          </>
        )}
      </button>
      <a
        href={`https://wa.me/?text=${messaggioWhatsApp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
      >
        Condividi su WhatsApp
      </a>
    </div>
  )
}
