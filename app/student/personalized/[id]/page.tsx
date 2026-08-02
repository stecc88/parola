import { notFound } from 'next/navigation'
import { AppNav } from '@/components/shared/AppNav'
import { getPersonalizedExerciseById, getSubmissionValutazione } from '../actions'
import { PersonalizedExerciseClient } from './PersonalizedExerciseClient'
import type { ValutazioneEsaminatore } from '@/lib/gemini/schema'
import { STUDENT_NAV_ITEMS } from '@/components/shared/studentNav'

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
    <>
      <AppNav items={STUDENT_NAV_ITEMS} />
      <main id="main-content" className="mx-auto max-w-3xl p-6 animate-fade-in">
        <PersonalizedExerciseClient
          esercizio={esercizio}
          valutazioneIniziale={valutazioneEsistente}
          testoConsegnato={testoConsegnato}
        />
      </main>
    </>
  )
}
