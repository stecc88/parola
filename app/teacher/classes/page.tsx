import { Card } from '@/components/ui/Card'

export default function TeacherClassesPage() {
  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Le mie classi</h1>
      <Card>
        {/*
          TODO:
          - Listar classes WHERE teacher_id = auth.uid() (RLS lo garantiza)
          - Crear clase: Server Action -> INSERT classes (invite_code se autogenera)
          - Mover estudiante entre clases del propio profesor:
            UPDATE class_memberships (cerrar actual con left_at, crear nueva)
        */}
      </Card>
    </main>
  )
}
