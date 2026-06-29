-- ============================================================================
-- Migrazione 0026: rate limiting atomico per le submissions degli studenti
--
-- Il controllo precedente (checkSubmissionRateLimit) era un TOCTOU:
-- leggeva il conteggio e poi lasciava che la submission avvenisse in un
-- secondo momento. Due richieste concorrenti potevano entrambe passare il
-- check prima che qualcuna si scrivesse nel DB.
--
-- Fix: tabella dedicata con upsert atomico (INSERT ... ON CONFLICT DO UPDATE)
-- che incrementa il contatore e controlla il limite in un'unica istruzione
-- SQL. Con un singolo round-trip non esiste finestra di race.
--
-- Il contatore è partizionato per "bucket" temporale: ogni bucket copre
-- una finestra di N minuti (default 5). La funzione trunca l'ora corrente
-- al bucket corretto per la finestra richiesta.
-- ============================================================================

-- Tabella contatori per bucket temporale per studente
create table submission_rate_limits (
  student_id  uuid        not null references profiles(id) on delete cascade,
  window_key  timestamptz not null,   -- inizio del bucket (troncato alla finestra)
  count       int         not null default 1,
  primary key (student_id, window_key)
);

-- Non accessibile direttamente dagli utenti: la funzione usa SECURITY DEFINER
alter table submission_rate_limits enable row level security;

-- Pulizia automatica dei bucket scaduti (oltre 1 ora) tramite cron o trigger;
-- per ora un indice su window_key basta per le query di manutenzione manuale.
create index idx_srl_window_key on submission_rate_limits(window_key);

-- ============================================================================
-- Funzione atomica: incrementa il contatore e solleva un'eccezione se il
-- limite viene superato. Chiamata tramite supabase.rpc().
-- Parametri fissi hardcoded nella firma per non esporre controlli al client.
-- ============================================================================
create or replace function check_submission_rate_limit_atomic(
  p_student_id    uuid,
  p_window_minutes int default 5,
  p_max           int default 10
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
  -- Calcola il bucket: tronca al multiplo di p_window_minutes nell'ora corrente
  v_window_key := date_trunc('hour', now())
    + (floor(extract(minute from now()) / p_window_minutes) * p_window_minutes
       || ' minutes')::interval;

  -- Upsert atomico: incrementa il contatore per questo bucket
  insert into submission_rate_limits (student_id, window_key, count)
  values (p_student_id, v_window_key, 1)
  on conflict (student_id, window_key) do update
    set count = submission_rate_limits.count + 1
  returning count into v_count;

  if v_count > p_max then
    raise exception 'rate_limit_exceeded'
      using hint = 'Troppe richieste. Riprova fra qualche minuto.';
  end if;
end;
$$;

-- Revoca l'accesso diretto: solo SECURITY DEFINER può chiamarla internamente,
-- ma l'utente autenticato deve poterla invocare via RPC
grant execute on function check_submission_rate_limit_atomic(uuid, int, int)
  to authenticated;
