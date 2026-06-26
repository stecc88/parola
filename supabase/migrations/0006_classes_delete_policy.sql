-- ============================================================================
-- Parola — Migración 0006: permitir al profesor eliminar sus propias classi
-- ============================================================================

create policy classes_delete_own_teacher
  on classes for delete
  using (teacher_id = auth.uid());
