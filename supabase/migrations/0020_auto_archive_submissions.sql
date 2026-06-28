-- Aggiunge colonna `archived` alle submissions.
-- Le submission archiviate:
--   • non compaiono nell'UI (né per lo studente né per il docente)
--   • vengono comunque incluse nel calcolo delle statistiche pedagogiche
--     (punteggi, errori per categoria, punti di forza, livello stimato)
--
-- Il trigger auto_archive_old_submissions archivia automaticamente tutte
-- le submission oltre le ultime 5 ogni volta che ne viene inserita una nuova.

alter table submissions
  add column if not exists archived boolean not null default false;

-- Index per velocizzare le query UI che filtrano archived = false.
create index if not exists idx_submissions_archived
  on submissions (student_id, archived, created_at desc);

-- Funzione trigger: dopo ogni INSERT, archivia le submission oltre le ultime 5.
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
    order by created_at desc
    offset 5
  );
  return NEW;
end;
$$;

-- Trigger: si attiva dopo ogni nuova submission inserita.
drop trigger if exists trg_auto_archive_submissions on submissions;
create trigger trg_auto_archive_submissions
  after insert on submissions
  for each row
  execute function auto_archive_old_submissions();
