-- ============================================================================
-- Parola — Migración 0015: fecha de habilitación + fecha de fin de suscripción
--
-- approved_at: cuándo se aprobó la cuenta (distinto de created_at, que es
-- cuándo se registró — pueden pasar días/semanas entre una cosa y la otra).
-- Se completa hacia atrás para cuentas ya aprobadas usando created_at como
-- mejor aproximación disponible (no tenemos el dato histórico real).
--
-- subscription_end_at: fecha de fin de suscripción que el admin puede
-- asignar manualmente a cualquier usuario. NULL = sin fecha de vencimiento
-- (uso indefinido). Por ahora es solo informativo — no bloquea acceso
-- automáticamente; eso se puede agregar después si se necesita.
-- ============================================================================

alter table profiles
  add column approved_at timestamptz,
  add column subscription_end_at timestamptz;

update profiles
set approved_at = created_at
where (role = 'teacher' and teacher_status = 'approved')
   or (role = 'student' and student_status = 'approved');

comment on column profiles.approved_at is
  'Fecha en que la cuenta fue aprobada (docente o alumno independiente). NULL si nunca fue aprobada explícitamente (ej. todavía pending).';
comment on column profiles.subscription_end_at is
  'Fecha de fin de suscripción asignada manualmente por el admin. NULL = sin vencimiento. Por ahora informativo, no bloquea acceso automáticamente.';
