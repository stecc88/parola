-- ============================================================================
-- Migrazione 0022: traguardo di livello
--
-- Il docente può impostare un livello obiettivo globale per la sua classe
-- (livello_obiettivo_classe sul proprio profilo). Quando uno studente
-- raggiunge o supera quel livello in una scrittura valutata, viene creato
-- un record in level_achievements che genera una notifica per entrambi.
-- ============================================================================

-- Livello obiettivo che il docente vuole far raggiungere ai suoi studenti.
-- Colonna separata da livello_target (che è degli studenti) per non toccare
-- il constraint esistente che blocca livello_target sui non-studenti.
alter table profiles
  add column if not exists livello_obiettivo_classe livello_cefr;

-- Tabella dei traguardi raggiunti.
-- unique(student_id, teacher_id, livello): un singolo record per livello
-- raggiunto — se il docente alza l'asticella e lo studente raggiunge il
-- livello successivo, viene creato un secondo record distinto.
create table if not exists level_achievements (
  id              uuid        primary key default gen_random_uuid(),
  student_id      uuid        not null references profiles(id) on delete cascade,
  teacher_id      uuid        not null references profiles(id) on delete cascade,
  livello         livello_cefr not null,
  seen_by_student boolean     not null default false,
  seen_by_teacher boolean     not null default false,
  created_at      timestamptz not null default now(),
  unique(student_id, teacher_id, livello)
);

alter table level_achievements enable row level security;

-- Lo studente vede i propri traguardi.
create policy level_achievements_select_student
  on level_achievements for select
  using (student_id = auth.uid());

-- Il docente vede i traguardi dei propri studenti.
create policy level_achievements_select_teacher
  on level_achievements for select
  using (teacher_id = auth.uid());

-- Il docente può aggiornare seen_by_teacher (tramite admin client nel codice).
create policy level_achievements_update_teacher
  on level_achievements for update
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());
