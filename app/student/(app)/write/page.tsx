import { getLivelloTarget } from '@/lib/student/livello'
import { WritePageClient } from './WritePageClient'

export default async function WritePage() {
  const livello = await getLivelloTarget()
  return <WritePageClient livelloIniziale={livello} />
}
