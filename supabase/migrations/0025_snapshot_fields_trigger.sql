-- ============================================================================
-- Migrazione 0025: popola i campi snapshot sulle submissions
--
-- class_id_at_submission e teacher_id_at_submission esistono dallo schema
-- iniziale ma non venivano mai scritti — le submissions archiviate avevano
-- quindi questi campi a NULL, rendendo impossibile risalire a quale classe/
-- docente era attivo al momento della consegna.
--
-- Fix: BEFORE trigger che li popola all'INSERT leggendo la membership
-- attiva dello studente in quel momento.
-- ============================================================================

create or replace function set_submission_snapshot()
returns trigger
language plpgsql
as $$
begin
  select teacher_id, class_id
    into new.teacher_id_at_submission, new.class_id_at_submission
  from class_memberships
  where student_id = new.student_id
    and left_at is null
  limit 1;

  return new;
end;
$$;

drop trigger if exists trg_set_submission_snapshot on submissions;

create trigger trg_set_submission_snapshot
  before insert on submissions
  for each row
  execute function set_submission_snapshot();
