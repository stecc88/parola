-- ============================================================================
-- Parola — Migración 0018: campanita de notificaciones para el alumno
--
-- Análogo a seen_by_teacher (migración 0009), pero al revés: marca si el
-- ALUMNO todavía no vio un ejercicio personalizado nuevo que le generó su
-- profesor. Default true para que las filas históricas existentes no
-- disparen de golpe una notificación falsa para tareas viejas — solo los
-- ejercicios generados a partir de ahora (con seen_by_student=false
-- explícito en el INSERT) generan notificación.
-- ============================================================================

alter table personalized_exercises
  add column seen_by_student boolean not null default true;
