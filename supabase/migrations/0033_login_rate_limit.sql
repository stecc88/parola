-- ============================================================================
-- Migrazione 0033: rate limiting atomico per il login con codice studente
--
-- resolveStudentAccessCode è una Server Action pubblica (pre-autenticazione):
-- senza limite, chiunque può chiamarla in loop per enumerare codici di
-- accesso, e ogni chiamata costa 2-3 chiamate admin a Supabase Auth
-- (amplificazione di costo). Stesso pattern atomico della migrazione 0026,
-- ma la chiave è un identificatore testuale (hash dell'IP) invece di un
-- uuid studente — chi tenta il login non è ancora autenticato.
-- ============================================================================

create table login_rate_limits (
  key_hash    text        not null,   -- sha-256 dell'IP (mai l'IP in chiaro)
  window_key  timestamptz not null,
  count       int         not null default 1,
  primary key (key_hash, window_key)
);

alter table login_rate_limits enable row level security;

create index idx_lrl_window_key on login_rate_limits(window_key);

create or replace function check_login_rate_limit_atomic(
  p_key_hash       text,
  p_window_minutes int default 5,
  p_max            int default 10
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_key timestamptz;
  v_count      int;
begin
  v_window_key := date_trunc('hour', now())
    + (floor(extract(minute from now()) / p_window_minutes) * p_window_minutes
       || ' minutes')::interval;

  insert into login_rate_limits (key_hash, window_key, count)
  values (p_key_hash, v_window_key, 1)
  on conflict (key_hash, window_key) do update
    set count = login_rate_limits.count + 1
  returning count into v_count;

  if v_count > p_max then
    raise exception 'rate_limit_exceeded'
      using hint = 'Troppi tentativi. Riprova fra qualche minuto.';
  end if;
end;
$$;

-- Il chiamante è il client admin (service_role) dentro la Server Action:
-- gli utenti anon/authenticated NON devono poterla invocare direttamente,
-- altrimenti chiunque potrebbe riempire i bucket altrui.
grant execute on function check_login_rate_limit_atomic(text, int, int)
  to service_role;
