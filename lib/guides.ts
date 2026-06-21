export interface Guida {
  slug: string
  titolo: string
  descrizione: string
  consegna: string
}

/**
 * Guide di scrittura: modalità guidata con consegna fissa per tipo di
 * testo. Al hacer clic en una guía, el estudiante va a /student/write
 * con la consegna pre-cargada; la evaluación de Gemini la tiene en
 * cuenta (ver lib/gemini/prompts/examinador.ts).
 */
export const GUIDES: Guida[] = [
  {
    slug: 'lettera-informale',
    titolo: 'Lettera informale',
    descrizione: 'Scrivi a un amico raccontando un evento recente.',
    consegna:
      'Scrivi una lettera informale a un amico/a raccontando qualcosa che ti è successo di recente. Usa un registro colloquiale, saluti iniziali e finali tipici di una lettera personale.'
  },
  {
    slug: 'email-formale',
    titolo: 'Email formale',
    descrizione: 'Scrivi una email per richiedere informazioni.',
    consegna:
      'Scrivi una email formale per richiedere informazioni su un corso, un servizio o un prodotto. Usa un registro formale, formule di apertura e chiusura appropriate.'
  },
  {
    slug: 'racconto-breve',
    titolo: 'Racconto breve',
    descrizione: "Inventa una breve storia con un'introduzione, sviluppo e conclusione.",
    consegna:
      "Scrivi un racconto breve (introduzione, sviluppo, conclusione) su un argomento a tua scelta. Presta attenzione alla coerenza temporale e all'uso dei tempi verbali del passato."
  },
  {
    slug: 'articolo-opinione',
    titolo: 'Articolo di opinione',
    descrizione: 'Esprimi e argomenta la tua opinione su un tema attuale.',
    consegna:
      'Scrivi un breve articolo di opinione su un tema di attualità a tua scelta. Presenta una tesi chiara, almeno due argomenti a supporto e una conclusione.'
  }
]

export function getGuidaBySlug(slug: string | null): Guida | undefined {
  return GUIDES.find((g) => g.slug === slug)
}
