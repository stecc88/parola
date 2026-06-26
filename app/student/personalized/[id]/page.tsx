import { notFound } from 'next/navigation'
import { AppNav } from '@/components/shared/AppNav'
import { getPersonalizedExerciseById, getSubmissionValutazione } from '../actions'
import { PersonalizedExerciseClient } from './PersonalizedExerciseClient'
import type { ValutazioneEsaminatore } from '@/lib/gemini/schema'

const NAV_ITEMS = [
  { href: '/student/progress', label: 'I miei progressi' },
  { href: '/student/write', label: 'Scrittura libera' },
  { href: '/student/exercises', label: 'Esercizi' },
  { href: '/student/guides', label: 'Guide' },
  { href: '/student/personalized', label: 'Per te' },
  { href: '/account', label: 'Account' }
]

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
      <AppNav items={NAV_ITEMS} />
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
