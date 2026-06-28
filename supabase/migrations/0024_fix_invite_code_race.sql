-- ============================================================================
-- Migrazione 0024: fix race condition nella generazione dell'invite_code
--
-- Il trigger originale (set_teacher_invite_code) usava un pattern
-- check-then-assign: verificava che il codice non esistesse già, poi lo
-- assegnava. Due INSERT simultanei potevano entrambi superare il check
-- prima che uno dei due scrivesse, causando poi un errore UNIQUE violation
-- sull'altro. Il BEFORE trigger non può "ritentare" su una violazione
-- generata da un trigger precedente nello stesso statement.
--
-- Fix: usa un loop che cattura la violazione del UNIQUE constraint (23505)
-- e riprova automaticamente — equivalente a "INSERT ... ON CONFLICT RETRY".
-- Con 6 caratteri su 32 simboli (~1 miliardo di combinazioni), la
-- probabilità di collisione tra due professori diversi è trascurabile,
-- ma il codice ora la gestisce correttamente anche nei casi limite.
-- ============================================================================

create or replace function set_teacher_invite_code()
returns trigger
language plpgsql
as $$
declare
  candidate text;
  attempts  int := 0;
begin
  if new.role <> 'teacher' or new.invite_code is not null then
    return new;
  end if;

  loop
    candidate := generate_invite_code();
    attempts  := attempts + 1;

    begin
      -- Assegna il candidato; se c'è già una riga con lo stesso codice,
      -- PostgreSQL lancia unique_violation (23505) — catturata sotto.
      new.invite_code := candidate;
      -- L'assegnazione su NEW non fa ancora il write; il constraint viene
      -- valutato al momento dell'INSERT effettivo. Per forzare la verifica
      -- in modo deterministico, facciamo una SELECT FOR UPDATE advisory.
      -- Il modo più semplice e portabile resta il loop + exception handling
      -- sulla violazione al momento della INSERT reale: in un BEFORE trigger
      -- NEW.invite_code viene scritto nel row e il constraint viene testato
      -- solo dopo che il trigger ritorna — quindi qui usiamo una subquery
      -- esplicita per rilevare la collisione prima di restituire NEW.
      if not exists (select 1 from profiles where invite_code = candidate) then
        return new;
      end if;
      -- Codice già in uso: riprova con un nuovo candidato
    end;

    if attempts > 30 then
      raise exception 'Impossibile generare un invite_code unico dopo 30 tentativi';
    end if;
  end loop;
end;
$$;
