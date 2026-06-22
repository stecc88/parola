-- ============================================================================
-- Parola — Migración 0008: esercizi personalizzati generati dall'IA
--
-- Permette al docente di generare, per UNO studente specifico, un esercizio
-- su misura (teoria + spiegazione + esempio + consegna pratica) basato sui
-- punti debili rilevati nelle correzioni precedenti di quello studente.
-- È deliberatamente una tabella separata da `exercises` (che è pensata per
-- banco globale/di classe, non per-studente) per non sovraccaricare quel
-- modello con un caso d'uso diverso.
--
-- La consegna pratica generata si risolve poi come una submission normale
-- di tipo 'scrittura_libera' (riusando tutta la pipeline di valutazione e
-- di verifica "rispetto_consegna" già esistente) — qui si salva solo il
-- collegamento (submission_id) una volta che lo studente risponde.
-- ============================================================================

create table personalized_exercises (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete restrict,
  teacher_id uuid not null references profiles(id) on delete restrict,
  titolo text not null,
  teoria text not null,
  spiegazione text not null,
  esempio text not null,
  consegna text not null,
  submission_id uuid references submissions(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_personalized_exercises_student on personalized_exercises(student_id);
create index idx_personalized_exercises_teacher on personalized_exercises(teacher_id);

alter table personalized_exercises enable row level security;

-- Il docente vede e crea solo gli esercizi che ha generato lui stesso, e
-- solo per uno studente attualmente suo (stessa logica di
-- is_active_teacher_of usata altrove).
create policy personalized_exercises_select_by_teacher
  on personalized_exercises for select
  using (teacher_id = auth.uid());

create policy personalized_exercises_insert_by_teacher
  on personalized_exercises for insert
  with check (
    teacher_id = auth.uid()
    and is_active_teacher_of(student_id)
  );

-- Lo studente vede solo gli esercizi assegnati a lui.
create policy personalized_exercises_select_by_student
  on personalized_exercises for select
  using (student_id = auth.uid());

-- Lo studente può collegare la propria submission una volta risposto, ma
-- non può toccare nessun altro campo (teoria/consegna/etc. restano fissi
-- una volta generati — la application layer invia solo submission_id, e
-- questa policy non lo impedisce a livello DB perché RLS non distingue
-- colonne in UPDATE; il vincolo è applicativo, come già documentato per
-- submissions.testo_studente).
create policy personalized_exercises_update_by_student
  on personalized_exercises for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());
