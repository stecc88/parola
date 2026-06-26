-- ============================================================================
-- Parola — Migración 0012: studenti indipendenti (senza insegnante)
--
-- Finora il codice insegnante era obbligatorio per registrarsi come
-- studente. Ora è opzionale: chi non ha un codice (es. un adulto che si
-- prepara da solo per un esame) può registrarsi comunque, ma il suo
-- account resta in stato "pending" finché un amministratore non lo
-- approva — stessa logica di approvazione già esistente per i docenti,
-- applicata qui agli studenti senza insegnante.
--
-- Chi invece usa un codice insegnante valido resta "approved"
-- immediatamente (il docente stesso fa da garante), nessun cambiamento
-- per il flusso esistente.
-- ============================================================================

create type student_status as enum ('pending', 'approved', 'rejected');

alter table profiles
  add column student_status student_status;

comment on column profiles.student_status is
  'Solo per role=student. NULL per chi si è unito con un codice insegnante valido fin da subito (approved implicito). pending/approved/rejected per chi si registra senza codice, in attesa di un amministratore.';

-- Reemplaza handle_new_user(): mismo comportamiento que antes para
-- nombre/cognome/role/teacher_status, agregando student_status según si
-- llegó o no un invite_code en el metadata del signup.
create or replace function handle_new_user()
returns trigger as $$
declare
  requested_role user_role;
  has_invite_code boolean;
begin
  requested_role := coalesce(
    (new.raw_user_meta_data->>'role')::user_role,
    'student'
  );

  has_invite_code := coalesce(trim(new.raw_user_meta_data->>'invite_code'), '') <> '';

  insert into profiles (id, role, nome, cognome, teacher_status, student_status)
  values (
    new.id,
    requested_role,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    coalesce(new.raw_user_meta_data->>'cognome', ''),
    case when requested_role = 'teacher' then 'pending'::teacher_status else null end,
    case
      when requested_role = 'student' and has_invite_code then 'approved'::student_status
      when requested_role = 'student' then 'pending'::student_status
      else null
    end
  );

  return new;
end;
$$ language plpgsql security definer set search_path = public;
