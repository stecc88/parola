-- ============================================================================
-- Parola — Migración 0001: schema base
-- Enums, tablas, triggers de soporte (sin RLS todavía, ver 0002)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

create type user_role as enum ('student', 'teacher', 'admin');

create type teacher_status as enum ('pending', 'approved', 'rejected', 'disabled');

create type submission_type as enum (
  'scrittura_libera',
  'esercizio_struttura_1',
  'esercizio_struttura_2',
  'esercizio_struttura_3',
  'esercizio_struttura_4'
);

-- ---------------------------------------------------------------------------
-- PROFILES
-- Espejo 1:1 de auth.users, con rol y datos propios de la app.
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'student',
  nome text not null,
  cognome text not null,
  -- Solo relevante si role = 'teacher'. NULL para student/admin.
  teacher_status teacher_status,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un profesor pending/rejected/disabled no debería tener teacher_status null
-- y un student/admin no debería tener teacher_status no-null.
alter table profiles
  add constraint teacher_status_consistency check (
    (role = 'teacher' and teacher_status is not null)
    or (role <> 'teacher' and teacher_status is null)
  );

create index idx_profiles_role on profiles(role);
create index idx_profiles_teacher_status on profiles(teacher_status) where role = 'teacher';

-- ---------------------------------------------------------------------------
-- CLASSES
-- Creadas libremente por el profesor. Código de invitación autogenerado.
-- ---------------------------------------------------------------------------

create table classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id) on delete restrict,
  nome text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_classes_teacher_id on classes(teacher_id);

-- on delete restrict en teacher_id: a propósito. No se puede borrar un
-- profesor mientras tenga classes asociadas (ver regla de negocio:
-- reasignación manual obligatoria antes de eliminar). Esto actúa como
-- segunda barrera a nivel de DB, además de la verificación en el endpoint.

-- ---------------------------------------------------------------------------
-- CLASS_MEMBERSHIPS
-- Historial de pertenencia de un estudiante a una clase.
-- left_at NULL = membership activa. Nunca se borra una fila al reasignar:
-- se cierra (left_at = now()) y se crea una nueva si corresponde.
-- ---------------------------------------------------------------------------

create table class_memberships (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete restrict,
  class_id uuid not null references classes(id) on delete restrict,
  joined_at timestamptz not null default now(),
  left_at timestamptz
);

create index idx_class_memberships_student on class_memberships(student_id);
create index idx_class_memberships_class on class_memberships(class_id);

-- Garantiza que un estudiante solo tenga UNA membership activa a la vez.
create unique index idx_one_active_membership_per_student
  on class_memberships(student_id)
  where left_at is null;

-- ---------------------------------------------------------------------------
-- EXERCISES
-- Catálogo de ejercicios (los 4 tipos de análisis de estructura + guías).
-- ---------------------------------------------------------------------------

create table exercises (
  id uuid primary key default gen_random_uuid(),
  tipo submission_type not null,
  titolo text not null,
  contenuto jsonb not null,
  -- Si class_id es NULL, el ejercicio es global (banco común);
  -- si no, es específico de esa clase.
  class_id uuid references classes(id) on delete set null,
  created_by uuid not null references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_exercises_class_id on exercises(class_id);
create index idx_exercises_tipo on exercises(tipo);

-- ---------------------------------------------------------------------------
-- SUBMISSIONS
-- Historial inmutable del estudiante. NUNCA depende de la membership activa:
-- referencia directa a student_id, y guarda un snapshot de clase/profesor
-- en el momento del envío para reportes históricos sin joins frágiles.
-- ---------------------------------------------------------------------------

create table submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete restrict,
  exercise_id uuid references exercises(id) on delete set null,
  tipo submission_type not null,
  testo_studente text not null,
  valutazione_ia jsonb,              -- NULL hasta que Gemini responde
  valutazione_completed_at timestamptz,
  -- Snapshot histórico, no FK estricta a la fila viva de classes/profiles
  -- para que sobreviva aunque la clase se reasigne o el profesor cambie:
  class_id_at_submission uuid references classes(id) on delete set null,
  teacher_id_at_submission uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_submissions_student_id on submissions(student_id);
create index idx_submissions_exercise_id on submissions(exercise_id);
create index idx_submissions_created_at on submissions(created_at desc);

-- ---------------------------------------------------------------------------
-- TRIGGERS: updated_at automático
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger trg_classes_updated_at
  before update on classes
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- TRIGGER: crear profile automáticamente al registrarse en auth.users
-- Lee metadata pasada en signUp (nome, cognome, role solicitado).
-- El role 'teacher' siempre nace en teacher_status = 'pending'.
-- ---------------------------------------------------------------------------

create or replace function handle_new_user()
returns trigger as $$
declare
  requested_role user_role;
begin
  requested_role := coalesce(
    (new.raw_user_meta_data->>'role')::user_role,
    'student'
  );

  insert into profiles (id, role, nome, cognome, teacher_status)
  values (
    new.id,
    requested_role,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    coalesce(new.raw_user_meta_data->>'cognome', ''),
    case when requested_role = 'teacher' then 'pending'::teacher_status else null end
  );

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- FUNCIÓN: generar invite_code único (6 caracteres alfanuméricos, sin
-- ambigüedad visual: sin 0/O, 1/I/l).
-- ---------------------------------------------------------------------------

create or replace function generate_invite_code()
returns text as $$
declare
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$ language plpgsql;

create or replace function set_invite_code()
returns trigger as $$
declare
  candidate text;
  attempts int := 0;
begin
  if new.invite_code is not null then
    return new;
  end if;

  loop
    candidate := generate_invite_code();
    attempts := attempts + 1;
    exit when not exists (select 1 from classes where invite_code = candidate);
    if attempts > 20 then
      raise exception 'No se pudo generar un invite_code único tras 20 intentos';
    end if;
  end loop;

  new.invite_code := candidate;
  return new;
end;
$$ language plpgsql;

create trigger trg_classes_set_invite_code
  before insert on classes
  for each row execute function set_invite_code();
