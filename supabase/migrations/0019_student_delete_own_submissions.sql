-- Permite que un alumno elimine sus propias submissions (textos y ejercicios).
-- La RLS de SELECT ya garantiza que solo puede ver las suyas; aquí añadimos
-- el privilegio de DELETE con la misma restricción (student_id = auth.uid()).
create policy submissions_delete_own
  on submissions
  for delete
  using (student_id = auth.uid());
