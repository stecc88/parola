import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <Skeleton className="mb-2 h-4 w-32" />
      <Skeleton className="mb-6 h-7 w-56" />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="text-center">
            <Skeleton className="mx-auto mb-2 h-5 w-5 rounded-full" />
            <Skeleton className="mx-auto mb-1 h-6 w-12" />
            <Skeleton className="mx-auto h-3 w-16" />
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <Skeleton className="h-40 w-full" />
      </Card>

      <Card>
        <Skeleton className="mb-3 h-4 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="mb-2 h-14 w-full" />
        ))}
      </Card>
    </main>
  )
}
