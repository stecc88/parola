-- Approva una richiesta di cambio nome in modo atomico:
-- aggiorna profiles e name_change_requests nella stessa transazione,
-- così non è possibile che il nome venga cambiato ma la richiesta
-- resti pending (o viceversa).
create or replace function approve_name_change_request(
  p_request_id  uuid,
  p_admin_id    uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id         uuid;
  v_nome_richiesto  text;
  v_cognome_richiesto text;
begin
  -- Legge e blocca la riga per evitare approvazioni concorrenti
  select user_id, nome_richiesto, cognome_richiesto
    into v_user_id, v_nome_richiesto, v_cognome_richiesto
    from name_change_requests
   where id = p_request_id
     and stato = 'pending'
   for update;

  if not found then
    raise exception 'Richiesta non trovata o già elaborata.' using errcode = 'P0002';
  end if;

  update profiles
     set nome    = v_nome_richiesto,
         cognome = v_cognome_richiesto
   where id = v_user_id;

  update name_change_requests
     set stato       = 'approved',
         reviewed_at = now(),
         reviewed_by = p_admin_id
   where id = p_request_id;
end;
$$;

-- Solo il service role può chiamarla (invocata dal admin client server-side)
revoke execute on function approve_name_change_request(uuid, uuid) from public, anon, authenticated;
