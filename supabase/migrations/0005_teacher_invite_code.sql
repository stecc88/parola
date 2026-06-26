-- ============================================================================
-- Parola — Migración 0005: código de invitación por profesor (no por clase)
--
-- Cambio de modelo: el estudiante se une con el código del PROFESOR (uno
-- solo, fijo), quedando "sin clase asignada" hasta que el profesor lo
-- ubique en una de sus clases. classes.invite_code queda en la tabla por
-- compatibilidad pero deja de usarse en el flujo de alta de estudiantes.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Código de invitación en profiles (solo para profesores)
-- ---------------------------------------------------------------------------

alter table profiles
  add column invite_code text unique;

create or replace function set_teacher_invite_code()
returns trigger as $$
declare
  candidate text;
  attempts int := 0;
begin
  -- Solo generamos código para profesores, y solo si todavía no tiene uno.
  if new.role <> 'teacher' or new.invite_code is not null then
    return new;
  end if;

  loop
    candidate := generate_invite_code();
    attempts := attempts + 1;
    exit when not exists (select 1 from profiles where invite_code = candidate);
    if attempts > 20 then
      raise exception 'No se pudo generar un invite_code único tras 20 intentos';
    end if;
  end loop;

  new.invite_code := candidate;
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_set_teacher_invite_code
  before insert or update on profiles
  for each row execute function set_teacher_invite_code();

-- Generar código para profesores que ya existan (ej. cuentas creadas
-- antes de esta migración).
update profiles set updated_at = updated_at where role = 'teacher' and invite_code is null;

-- ---------------------------------------------------------------------------
-- 2) class_memberships: class_id ahora es opcional, teacher_id explícito
-- ---------------------------------------------------------------------------

alter table class_memberships
  add column teacher_id uuid references profiles(id) on delete restrict;

-- Backfill desde la clase actual, para las membresías que ya existían.
update class_memberships cm
set teacher_id = c.teacher_id
from classes c
where c.id = cm.class_id
  and cm.teacher_id is null;

alter table class_memberships
  alter column teacher_id set not null;

alter table class_memberships
  alter column class_id drop not null;

create index idx_class_memberships_teacher on class_memberships(teacher_id);

-- ---------------------------------------------------------------------------
-- 3) Simplificar is_active_teacher_of y políticas que dependían del join
--    contra classes — ahora se apoyan directo en teacher_id.
-- ---------------------------------------------------------------------------

create or replace function is_active_teacher_of(p_student_id uuid)
returns boolean as $$
  select exists (
    select 1
    from class_memberships cm
    where cm.student_id = p_student_id
      and cm.left_at is null
      and cm.teacher_id = auth.uid()
  );
$$ language sql security definer stable;

drop policy if exists memberships_select_by_teacher on class_memberships;
create policy memberships_select_by_teacher
  on class_memberships for select
  using (teacher_id = auth.uid());

drop policy if exists memberships_update_by_teacher on class_memberships;
create policy memberships_update_by_teacher
  on class_memberships for update
  using (teacher_id = auth.uid());

-- El insert ahora lo hace el endpoint con el cliente admin (porque busca
-- el profesor por invite_code antes de tener una clase concreta a la que
-- enlazar vía RLS normal), pero mantenemos la policy de todas formas para
-- cualquier insert hecho con sesión de estudiante.
drop policy if exists memberships_insert_own_student on class_memberships;
create policy memberships_insert_own_student
  on class_memberships for insert
  with check (student_id = auth.uid());
