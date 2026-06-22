import { notFound } from 'next/navigation'
import { AppNav } from '@/components/shared/AppNav'
import { getPersonalizedExerciseById, getSubmissionValutazione } from '../actions'
import { PersonalizedExerciseClient } from './PersonalizedExerciseClient'
import type { ValutazioneEsaminatore } from '@/lib/gemini/schema'

const NAV_ITEMS = [
  { href: '/student/write', label: 'Scrittura libera' },
  { href: '/student/exercises', label: 'Esercizi' },
  { href: '/student/guides', label: 'Guide' },
  { href: '/student/personalized', label: 'Per te' },
  { href: '/student/progress', label: 'I miei progressi' }
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

  const valutazioneEsistente = esercizio.submission_id
    ? ((await getSubmissionValutazione(esercizio.submission_id)) as ValutazioneEsaminatore | null)
    : null

  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main className="mx-auto max-w-3xl p-6">
        <PersonalizedExerciseClient esercizio={esercizio} valutazioneIniziale={valutazioneEsistente} />
      </main>
    </>
  )
}
