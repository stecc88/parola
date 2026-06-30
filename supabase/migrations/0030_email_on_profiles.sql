-- Aggiunge colonna email a profiles e la mantiene sincronizzata con auth.users.
-- Obiettivo: eliminare le chiamate a auth.admin.listUsers / getUserById solo
-- per ottenere l'email — operazioni costose (N+1 o full scan) che non scalano.
-- Dopo questa migrazione, getEmailMap e i notifier leggono direttamente
-- da profiles con una query RLS normale.

-- 1. Colonna email su profiles
alter table profiles add column if not exists email text;

-- 2. Backfill: copia le email esistenti da auth.users
update profiles
set email = u.email
from auth.users u
where u.id = profiles.id
  and profiles.email is null;

-- 3. Aggiorna il trigger handle_new_user per includere l'email alla creazione
create or replace function handle_new_user()
returns trigger as $$
declare
  requested_role user_role;
begin
  requested_role := coalesce(
    (new.raw_user_meta_data->>'role')::user_role,
    'student'
  );

  insert into profiles (id, role, nome, cognome, teacher_status, email)
  values (
    new.id,
    requested_role,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    coalesce(new.raw_user_meta_data->>'cognome', ''),
    case when requested_role = 'teacher' then 'pending'::teacher_status else null end,
    new.email
  );

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 4. Trigger per sincronizzare l'email quando cambia su auth.users
--    (caso: utente cambia email tramite Supabase Auth)
create or replace function sync_email_to_profile()
returns trigger as $$
begin
  if new.email is distinct from old.email then
    update profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_sync_email_to_profile
  after update of email on auth.users
  for each row execute function sync_email_to_profile();

-- 5. RLS: solo l'admin (service role) può leggere email altrui;
--    ogni utente può leggere la propria.
--    La colonna è già coperta dalla policy profiles_select_own esistente
--    (select where id = auth.uid()) — non serve una policy separata.
--    Il client admin (service role) bypassa RLS, quindi getEmailMap
--    funziona senza policy aggiuntive.
