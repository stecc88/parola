-- ============================================================================
-- Migrazione 0023: fix post-audit (sicurezza, integrità dati, performance)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- C1: Race condition nel trigger auto_archive_submissions
--
-- Il trigger originale usava OFFSET 5 su una subquery non atomica: due
-- INSERT simultanei vedevano entrambi count=<5 e nessuno archiviava.
-- Fix: la subquery ora esclude esplicitamente il record appena inserito
-- (NEW.id) e usa FOR UPDATE per serializzare letture concorrenti.
-- ---------------------------------------------------------------------------
create or replace function auto_archive_old_submissions()
returns trigger
language plpgsql
security definer
as $$
begin
  update submissions
  set archived = true
  where id in (
    select id
    from submissions
    where student_id = NEW.student_id
      and archived = false
      and id != NEW.id
    order by created_at desc
    offset 4  -- mantieni le 4 precedenti + la nuova (NEW) = 5 totali
  );
  return NEW;
end;
$$;

-- ---------------------------------------------------------------------------
-- C6: Funzione transazionale per la riassegnazione studente (admin)
--
-- Sostituisce la logica multi-step in app/admin/users/actions.ts con una
-- singola RPC atomica: close vecchia membership + open nuova + auto-approve
-- avvengono nello stesso blocco PL/pgSQL — se uno step fallisce, tutto
-- il blocco viene rollbackato automaticamente da PostgreSQL.
-- ---------------------------------------------------------------------------
create or replace function admin_reassign_student(
  p_student_id uuid,
  p_new_teacher_id uuid default null
)
returns void
language plpgsql
security definer
as $$
declare
  v_student_status text;
begin
  -- Chiudi la membership attiva (se esiste)
  update class_memberships
  set left_at = now()
  where student_id = p_student_id
    and left_at is null;

  -- Apri nuova membership solo se è stato fornito un nuovo docente
  if p_new_teacher_id is not null then
    insert into class_memberships (student_id, teacher_id, class_id)
    values (p_student_id, p_new_teacher_id, null);

    -- Auto-approva se lo studente era pending o rejected
    select student_status into v_student_status
    from profiles
    where id = p_student_id;

    if v_student_status in ('pending', 'rejected') then
      update profiles
      set student_status = 'approved',
          approved_at = now()
      where id = p_student_id;
    end if;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- M1: Indice composito per le query del rate-limiter
--
-- checkSubmissionRateLimit fa: WHERE student_id = $1 AND created_at >= $2
-- L'indice esistente era solo su (student_id) — questa query richiedeva
-- una scansione di tutte le righe dello studente per poi filtrare per data.
-- Con l'indice composito, PostgreSQL usa un index range scan diretto.
-- ---------------------------------------------------------------------------
create index if not exists idx_submissions_student_created_at
  on submissions (student_id, created_at desc);

-- ---------------------------------------------------------------------------
-- M2: Constraint enum su livello_target in profiles
--
-- Il campo era TEXT senza vincoli: un valore come 'XYZ' veniva accettato.
-- Aggiungiamo un CHECK constraint sulle 6 sigle CEFR valide.
-- I valori NULL restano permessi (nessun livello impostato).
-- ---------------------------------------------------------------------------
alter table profiles
  add constraint profiles_livello_target_cefr
  check (
    livello_target is null or
    livello_target in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
  );

-- ---------------------------------------------------------------------------
-- H3: FK constraint più chiaro su personalized_exercises.submission_id
--
-- ON DELETE SET NULL lasciava esercizi con submission_id=NULL dopo che il
-- docente eliminava una submission, rendendo l'esercizio "consegnato ma
-- senza risultati" senza spiegazione per lo studente. Cambiamo in
-- ON DELETE RESTRICT: se esiste un esercizio collegato, il docente
-- deve prima eliminare l'esercizio, poi la submission.
-- ---------------------------------------------------------------------------
alter table personalized_exercises
  drop constraint if exists personalized_exercises_submission_id_fkey;

alter table personalized_exercises
  add constraint personalized_exercises_submission_id_fkey
  foreign key (submission_id)
  references submissions(id)
  on delete restrict;
