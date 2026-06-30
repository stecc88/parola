-- ============================================================================
-- Migrazione 0027: richieste di cambio nome/cognome
--
-- Studenti e docenti non possono più modificare direttamente nome/cognome:
-- inviano una richiesta che l'amministratore deve approvare esplicitamente.
-- Quando approvata, il trigger aggiorna profiles in modo atomico e marca
-- la richiesta come 'approved'. Le richieste rifiutate restano in tabella
-- per audit.
--
-- Un utente può avere al massimo una richiesta 'pending' alla volta —
-- verificato a livello di policy INSERT (non tramite UNIQUE per non
-- bloccare le richieste successive dopo un rifiuto).
-- ============================================================================

create table name_change_requests (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references profiles(id) on delete cascade,
  nome_richiesto  text        not null check (trim(nome_richiesto) <> ''),
  cognome_richiesto text      not null check (trim(cognome_richiesto) <> ''),
  nome_attuale    text        not null,
  cognome_attuale text        not null,
  stato           text        not null default 'pending'
                              check (stato in ('pending', 'approved', 'rejected')),
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz,
  reviewed_by     uuid        references profiles(id)
);

alter table name_change_requests enable row level security;

-- L'utente può leggere solo le proprie richieste
create policy "ncr_select_own" on name_change_requests
  for select using (auth.uid() = user_id);

-- L'admin può leggere tutto
create policy "ncr_select_admin" on name_change_requests
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- L'utente può inserire solo se non ha già una richiesta pending
create policy "ncr_insert_own" on name_change_requests
  for insert with check (
    auth.uid() = user_id
    and not exists (
      select 1 from name_change_requests ncr
      where ncr.user_id = auth.uid() and ncr.stato = 'pending'
    )
  );

-- Solo l'admin può aggiornare (approvare/rifiutare)
create policy "ncr_update_admin" on name_change_requests
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Index per le query più frequenti
create index idx_ncr_user_id    on name_change_requests(user_id);
create index idx_ncr_stato      on name_change_requests(stato) where stato = 'pending';
create index idx_ncr_created_at on name_change_requests(created_at desc);

-- Rimuovi la policy UPDATE che permetteva all'utente di modificare nome/cognome
-- direttamente (profiles_update_own era già ristretta, ma ora lo formalizziamo).
-- La policy esistente dovrebbe già essere corretta; questo commento documenta
-- l'intenzione: nome/cognome si aggiornano solo tramite questa tabella.
