-- ============================================================================
-- Parola — Migración 0003: nivel objetivo del estudiante
-- ============================================================================

create type livello_cefr as enum ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

alter table profiles
  add column livello_target livello_cefr;

-- Solo aplica a estudiantes; profesores/admin lo dejan NULL.
alter table profiles
  add constraint livello_target_only_student check (
    (role = 'student') or (livello_target is null)
  );

comment on column profiles.livello_target is
  'Nivel CEFR objetivo del estudiante, usado para calibrar la dificultad de scrittura libera y esercizi di struttura. NULL = sin definir, se usa B1 por defecto.';
