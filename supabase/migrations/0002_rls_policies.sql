-- ============================================================================
-- Parola — Migración 0002: Row Level Security
--
-- Convención: las operaciones de admin (aprobar/rechazar/disable/delete
-- profesor, reasignar estudiante, reasignar clases en bloque) NUNCA pasan
-- por estas políticas — se ejecutan server-side con createAdminClient()
-- (service role key), que bypassea RLS por diseño de Supabase. Las políticas
-- de aquí abajo gobiernan exclusivamente el acceso vía cliente browser/anon
-- con sesión de usuario normal (student/teacher autenticado).
-- ============================================================================

alter table profiles enable row level security;
alter table classes enable row level security;
alter table class_memberships enable row level security;
alter table exercises enable row level security;
alter table submissions enable row level security;

-- ---------------------------------------------------------------------------
-- Helper: ¿el usuario actual es profesor de la clase activa de student_id?
-- (evita repetir el mismo join en cada política)
-- ---------------------------------------------------------------------------

create or replace function is_active_teacher_of(p_student_id uuid)
returns boolean as $$
  select exists (
    select 1
    from class_memberships cm
    join classes c on c.id = cm.class_id
    where cm.student_id = p_student_id
      and cm.left_at is null
      and c.teacher_id = auth.uid()
  );
$$ language sql security definer stable;

create or replace function current_role_is(p_role user_role)
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = p_role
  );
$$ language sql security definer stable;

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------

-- Cualquier usuario autenticado lee su propio perfil.
create policy profiles_select_own
  on profiles for select
  using (id = auth.uid());

-- Un profesor lee los perfiles de sus estudiantes activos.
create policy profiles_select_by_teacher
  on profiles for select
  using (role = 'student' and is_active_teacher_of(id));

-- Un usuario solo puede editar campos propios no sensibles (nome/cognome).
-- role y teacher_status quedan fuera del alcance de esta policy porque
-- el UPDATE de esos campos debe pasar solo por admin client. Se controla
-- a nivel de aplicación (Server Action no expone esos campos en el form);
-- como refuerzo en DB, se podría mover a una vista restringida si se quiere
-- blindar más. Documentado como deuda técnica intencional, no omisión.
create policy profiles_update_own
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Insert de profiles ocurre únicamente vía el trigger handle_new_user()
-- (security definer), nunca directo desde el cliente. No se define policy
-- de insert para anon/authenticated → insert directo queda bloqueado.

-- ---------------------------------------------------------------------------
-- CLASSES
-- ---------------------------------------------------------------------------

-- El profesor ve y administra solo sus propias clases.
create policy classes_select_own_teacher
  on classes for select
  using (teacher_id = auth.uid());

create policy classes_insert_own_teacher
  on classes for insert
  with check (
    teacher_id = auth.uid()
    and current_role_is('teacher')
  );

create policy classes_update_own_teacher
  on classes for update
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- El estudiante ve la(s) clase(s) a la(s) que pertenece (activa o histórica,
-- para poder mostrar "estuviste en la clase X hasta tal fecha").
create policy classes_select_by_member_student
  on classes for select
  using (
    exists (
      select 1 from class_memberships cm
      where cm.class_id = classes.id
        and cm.student_id = auth.uid()
    )
  );

-- No hay policy de delete: borrar una clase es operación admin-only
-- (o no se permite nunca, a decidir — por ahora bloqueado por omisión).

-- ---------------------------------------------------------------------------
-- CLASS_MEMBERSHIPS
-- ---------------------------------------------------------------------------

create policy memberships_select_own_student
  on class_memberships for select
  using (student_id = auth.uid());

create policy memberships_select_by_teacher
  on class_memberships for select
  using (
    exists (
      select 1 from classes c
      where c.id = class_memberships.class_id
        and c.teacher_id = auth.uid()
    )
  );

-- El estudiante crea su propia membership al unirse con invite_code.
-- La validación de "el invite_code existe y corresponde a esta class_id"
-- ocurre en el Route Handler /api/classes/join antes del insert (defensa
-- en profundidad: aquí solo garantizamos que no pueda crear memberships
-- para OTRO estudiante).
create policy memberships_insert_own_student
  on class_memberships for insert
  with check (student_id = auth.uid());

-- "Salir" de una clase = el propio estudiante cierra su membership
-- (set left_at). Mover de clase entre profesores/clases del MISMO profesor
-- también pasa por aquí si el profesor lo hace desde su propia sesión.
create policy memberships_update_own_student
  on class_memberships for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy memberships_update_by_teacher
  on class_memberships for update
  using (
    exists (
      select 1 from classes c
      where c.id = class_memberships.class_id
        and c.teacher_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- EXERCISES
-- ---------------------------------------------------------------------------

-- Banco global (class_id is null): cualquier usuario autenticado lo lee.
create policy exercises_select_global
  on exercises for select
  using (class_id is null);

-- Ejercicios específicos de clase: visibles para el profesor dueño
-- y para los estudiantes con membership activa en esa clase.
create policy exercises_select_class_teacher
  on exercises for select
  using (
    exists (
      select 1 from classes c
      where c.id = exercises.class_id and c.teacher_id = auth.uid()
    )
  );

create policy exercises_select_class_student
  on exercises for select
  using (
    exists (
      select 1 from class_memberships cm
      where cm.class_id = exercises.class_id
        and cm.student_id = auth.uid()
        and cm.left_at is null
    )
  );

create policy exercises_insert_by_teacher
  on exercises for insert
  with check (
    current_role_is('teacher')
    and created_by = auth.uid()
    and (
      class_id is null
      or exists (select 1 from classes c where c.id = class_id and c.teacher_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- SUBMISSIONS
-- ---------------------------------------------------------------------------

-- El estudiante lee y crea solo las suyas.
create policy submissions_select_own_student
  on submissions for select
  using (student_id = auth.uid());

create policy submissions_insert_own_student
  on submissions for insert
  with check (student_id = auth.uid());

-- El estudiante puede actualizar su propia submission únicamente para
-- recibir la valutazione_ia (escrita por el Route Handler con su propia
-- sesión, no con admin client — Gemini se llama en nombre del usuario
-- autenticado). No permitimos modificar testo_studente después de creada
-- (inmutabilidad del envío); eso se refuerza a nivel de aplicación, ya que
-- RLS por sí sola no distingue columnas en UPDATE sin un trigger adicional.
create policy submissions_update_own_student
  on submissions for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- El profesor SOLO lee (nunca escribe) las submissions de sus estudiantes
-- *activos*. Las de un estudiante ya reasignado a otro profesor dejan de
-- ser visibles para el profesor anterior — el histórico persiste en DB
-- pero el acceso sigue la membership/asignación vigente, no el snapshot.
create policy submissions_select_by_active_teacher
  on submissions for select
  using (is_active_teacher_of(student_id));

-- No hay policy de delete en ninguna tabla histórica (submissions,
-- class_memberships): el borrado físico de historial no está permitido
-- ni siquiera para admin vía API normal; si alguna vez se necesita, debe
-- ser una operación manual directa en DB, fuera del flujo de la app.

-- ---------------------------------------------------------------------------
-- Nota sobre trigger de inmutabilidad de testo_studente (refuerzo opcional)
-- ---------------------------------------------------------------------------

create or replace function prevent_testo_studente_update()
returns trigger as $$
begin
  if new.testo_studente is distinct from old.testo_studente then
    raise exception 'testo_studente es inmutable una vez creada la submission';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_submissions_immutable_testo
  before update on submissions
  for each row execute function prevent_testo_studente_update();
