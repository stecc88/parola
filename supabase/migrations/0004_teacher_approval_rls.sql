-- ============================================================================
-- Parola — Migración 0004: reforzar RLS para exigir profesor aprobado
--
-- current_role_is('teacher') solo verificaba el rol, no el estado de
-- aprobación. Un profesor con teacher_status='pending' podía crear classi
-- y exercises igual, porque nada en RLS lo impedía — el único freno era
-- la UI (que ahora también se corrigió en app/teacher/...).
-- ============================================================================

create or replace function is_approved_teacher()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role = 'teacher'
      and teacher_status = 'approved'
  );
$$ language sql security definer stable;

drop policy if exists classes_insert_own_teacher on classes;
create policy classes_insert_own_teacher
  on classes for insert
  with check (
    teacher_id = auth.uid()
    and is_approved_teacher()
  );

drop policy if exists exercises_insert_by_teacher on exercises;
create policy exercises_insert_by_teacher
  on exercises for insert
  with check (
    is_approved_teacher()
    and created_by = auth.uid()
    and (
      class_id is null
      or exists (select 1 from classes c where c.id = class_id and c.teacher_id = auth.uid())
    )
  );
