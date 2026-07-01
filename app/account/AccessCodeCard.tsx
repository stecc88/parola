import { Card } from '@/components/ui/Card'
import { CopyButton } from '@/components/ui/CopyButton'

export function AccessCodeCard({ accessCode }: { accessCode: string }) {
  return (
    <Card className="mb-6">
      <h2 className="mb-1 text-sm font-semibold text-ink-primary">Il tuo codice di accesso</h2>
      <p className="mb-3 text-sm text-ink-secondary">
        Usa questo codice per accedere a Parola. Conservalo in un posto sicuro.
      </p>
      <div className="flex items-center gap-3 rounded-lg bg-surface-secondary px-4 py-3">
        <span className="font-mono text-xl font-bold tracking-widest text-brand-400 flex-1">
          {accessCode}
        </span>
        <CopyButton
          text={accessCode}
          className="shrink-0 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-ink-secondary hover:border-brand-400 hover:text-ink-primary transition-colors"
        />
      </div>
    </Card>
  )
}
