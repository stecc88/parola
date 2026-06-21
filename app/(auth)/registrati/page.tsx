import { Card } from '@/components/ui/Card'

export default function RegistratiPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <h1 className="mb-4 text-xl font-semibold">Registrati</h1>
        {/*
          TODO: form de registro.
          - Studente: richiede codice classe (invite_code) -> Server Action
            que crea profile + class_membership en una transacción.
          - Insegnante: crea profile con teacher_status='pending',
            queda bloqueado hasta aprobación del admin.
        */}
      </Card>
    </main>
  )
}
