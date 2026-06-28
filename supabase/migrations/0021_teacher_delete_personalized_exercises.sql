-- Permette al docente che ha creato un esercizio personalizzato di eliminarlo.
-- La condizione teacher_id = auth.uid() garantisce che un docente possa
-- eliminare solo gli esercizi che ha generato lui stesso.
create policy personalized_exercises_delete_by_teacher
  on personalized_exercises
  for delete
  using (teacher_id = auth.uid());
