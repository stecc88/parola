import { notFound } from 'next/navigation'
import { getPersonalizedExerciseById, getSubmissionValutazione } from '../actions'
import { PersonalizedExerciseClient } from './PersonalizedExerciseClient'
import type { ValutazioneEsaminatore } from '@/lib/gemini/schema'

export default async function PersonalizedExerciseDetailPage({
  params
}: {
  params: { id: string }
}) {
  const esercizio = await getPersonalizedExerciseById(params.id)

  if (!esercizio) {
    notFound()
  }

  const submissionData = esercizio.submission_id
    ? await getSubmissionValutazione(esercizio.submission_id)
    : null

  const valutazioneEsistente = submissionData?.valutazione as ValutazioneEsaminatore | null
  const testoConsegnato = submissionData?.testo ?? null

  return (
    <main id="main-content" className="mx-auto max-w-3xl p-6 animate-fade-in">
      <PersonalizedExerciseClient
        esercizio={esercizio}
        valutazioneIniziale={valutazioneEsistente}
        testoConsegnato={testoConsegnato}
      />
    </main>
  )
}
