-- Aggiunge colonna last_sign_in_at a profiles e la mantiene sincronizzata
-- con auth.users, stesso pattern di 0030_email_on_profiles.sql.
-- Obiettivo: eliminare le chiamate a auth.admin.getUserById (una per
-- studente, anche se in parallelo) fatte solo per mostrare "Ultimo
-- accesso" nella vista studenti del docente — con questa migrazione la
-- data arriva gratis dallo stesso JOIN su profiles già usato per
-- nome/cognome/livello, senza nessuna chiamata aggiuntiva all'Admin API.

-- 1. Colonna last_sign_in_at su profiles
alter table profiles add column if not exists last_sign_in_at timestamptz;

-- 2. Backfill: copia i valori esistenti da auth.users
update profiles
set last_sign_in_at = u.last_sign_in_at
from auth.users u
where u.id = profiles.id
  and profiles.last_sign_in_at is null;

-- 3. Trigger per sincronizzare last_sign_in_at quando cambia su auth.users
--    (si aggiorna a ogni login — a differenza dell'email, quindi questo
--    trigger scatta molto più spesso, ma resta un UPDATE per chiave
--    primaria su una singola riga: costo trascurabile rispetto al giro
--    di N chiamate all'Admin API che sostituisce).
create or replace function sync_last_sign_in_to_profile()
returns trigger as $$
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at then
    update profiles set last_sign_in_at = new.last_sign_in_at where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_sync_last_sign_in_to_profile
  after update of last_sign_in_at on auth.users
  for each row execute function sync_last_sign_in_to_profile();

-- 4. RLS: nessuna policy aggiuntiva necessaria — la colonna è coperta
--    dalle policy SELECT già esistenti su profiles (profiles_select_own,
--    profiles_select_by_teacher), essendo la RLS di Postgres a livello di
--    riga e non di colonna. Il client admin (service role) bypassa RLS
--    comunque.
