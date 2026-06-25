-- ============================================================================
-- Parola — Migración 0017: corrección de sobre-restricción en el trigger de seguridad
--
-- La migración 0016 bloqueó cambios a livello_target pensando que era un
-- campo sensible — pero en realidad es una preferencia personal del
-- propio alumno (qué nivel CEFR está entrenando), exactamente como
-- nome/cognome. No hay ningún riesgo de seguridad en que un alumno elija
-- su propio nivel objetivo. Esto rompió la función setLivelloTarget()
-- usada en /student/write y /student/exercises.
-- ============================================================================

create or replace function prevent_unauthorized_profile_changes()
returns trigger as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Non autorizzato a modificare il ruolo.';
  end if;
  if new.teacher_status is distinct from old.teacher_status then
    raise exception 'Non autorizzato a modificare lo stato insegnante.';
  end if;
  if new.student_status is distinct from old.student_status then
    raise exception 'Non autorizzato a modificare lo stato studente.';
  end if;
  if new.invite_code is distinct from old.invite_code then
    raise exception 'Non autorizzato a modificare il codice invito.';
  end if;
  if new.approved_at is distinct from old.approved_at then
    raise exception 'Non autorizzato a modificare la data di approvazione.';
  end if;
  if new.subscription_end_at is distinct from old.subscription_end_at then
    raise exception 'Non autorizzato a modificare la scadenza abbonamento.';
  end if;
  if new.id is distinct from old.id then
    raise exception 'Non autorizzato a modificare l''id.';
  end if;

  -- nome, cognome, livello_target, created_at, updated_at: libres de
  -- modificar por el propio usuario — son preferencias/datos personales,
  -- no campos de privilegio.
  return new;
end;
$$ language plpgsql;
