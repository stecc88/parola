-- ============================================================================
-- Parola — Migración 0016: cierre de vulnerabilidades de auditoría de seguridad
--
-- Hallazgo más grave: la policy profiles_update_own (using id=auth.uid(),
-- sin restricción de columna) permitía que CUALQUIER usuario autenticado
-- escribiera role='admin', teacher_status='approved', student_status,
-- approved_at o subscription_end_at en su propia fila, llamando
-- directamente a la API REST de Supabase con su propia sesión — sin pasar
-- por ningún botón ni pantalla de la aplicación. Esto permitía
-- auto-escalado de privilegios a administrador.
--
-- Mismo patrón (sin gravedad de escalado de privilegios, pero sí de
-- integridad académica) en:
--   - submissions_update_own_student: un estudiante podía escribirse
--     valutazione_ia con cualquier puntaje, sin pasar por Gemini.
--   - personalized_exercises_update_by_student: un estudiante podía
--     escribirse punteggio_chiuso=100 sin responder nada correctamente.
--
-- Fix: las dos policies de UPDATE para estudiantes se eliminan (las
-- escrituras correspondientes ahora se hacen con el cliente admin desde
-- el código de la aplicación, después de validar todo lo necesario —
-- ver app/api/gemini/evaluate/route.ts y
-- app/student/personalized/actions.ts). Para profiles, en vez de eliminar
-- la policy completa (nome/cognome SÍ deben seguir siendo
-- auto-editables, ver app/account/actions.ts), se agrega un trigger que
-- restringe a nivel de columna lo que un usuario normal puede cambiar de
-- su propia fila.
-- ============================================================================

drop policy submissions_update_own_student on submissions;
drop policy personalized_exercises_update_by_student on personalized_exercises;

create or replace function prevent_unauthorized_profile_changes()
returns trigger as $$
begin
  -- El service role (cliente admin) puede modificar cualquier columna —
  -- es lo que usan las acciones de /admin/users y los flujos internos de
  -- aprobación. Solo se restringe a usuarios autenticados normales.
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
  if new.livello_target is distinct from old.livello_target then
    raise exception 'Non autorizzato a modificare il livello target.';
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

  -- nome, cognome, created_at, updated_at: libres de modificar (nome/cognome
  -- es exactamente el caso de uso legítimo de profiles_update_own).
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_restrict_self_update on profiles;
create trigger profiles_restrict_self_update
  before update on profiles
  for each row
  execute function prevent_unauthorized_profile_changes();
