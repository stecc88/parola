import { getLivelloTarget } from '@/lib/student/livello'
import { ExercisesPageClient } from './ExercisesPageClient'

export default async function ExercisesPage() {
  const livello = await getLivelloTarget()
  return <ExercisesPageClient livelloIniziale={livello} />
}
