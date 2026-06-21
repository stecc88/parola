import { Card } from '@/components/ui/Card'

export default function AdminUsersPage() {
  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Gestione insegnanti</h1>
      <Card>
        {/*
          TODO:
          - Listar profiles WHERE role='teacher' (vía admin client, server-side)
          - Aprobar/rechazar (teacher_status)
          - Disable (reversible) / Delete (irreversible, requiere:
            1. confirmación con nombre exacto
            2. que no tenga classes/estudiantes activos -> bloqueado por
               constraint ON DELETE RESTRICT + verificación explícita en
               app/api/admin/teachers/[id]/route.ts (pendiente de crear)
          - Reasignar estudiante a otro profesor
        */}
      </Card>
    </main>
  )
}
