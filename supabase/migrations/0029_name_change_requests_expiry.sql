-- Auto-rifiuta le richieste di cambio nome rimaste pending da più di 30 giorni.
-- Viene chiamata lato server prima di mostrare la lista all'admin,
-- ma definiamo anche una funzione richiamabile da un cron job Supabase
-- per pulizia periodica autonoma.
create or replace function expire_pending_name_change_requests()
returns void
language sql
security definer
set search_path = public
as $$
  update name_change_requests
     set stato       = 'rejected',
         reviewed_at = now()
   where stato = 'pending'
     and created_at < now() - interval '30 days';
$$;

-- Solo service role può chiamarla
revoke execute on function expire_pending_name_change_requests() from public, anon, authenticated;
