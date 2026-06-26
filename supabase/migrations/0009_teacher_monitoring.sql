-- ============================================================================
-- Parola — Migración 0009: monitoraggio completo del docente
--
-- 1) seen_by_teacher: notifica al docente quando uno studente consegna la
--    risposta a un esercizio personalizzato. Default true perché al momento
--    della creazione (prima che lo studente risponda) non c'è nulla da
--    notificare; si imposta esplicitamente a false quando arriva una
--    risposta, e torna a true quando il docente visita la pagina dello
--    studente (marcato come "letto").
--
-- 2) Permesso di DELETE su submissions per il docente attivo dello
--    studente. ATTENZIONE — cambio di design intenzionale rispetto al
--    commento originale in 0002 ("il borrado físico de historial no está
--    permitido ni siquiera para admin"): il proprietario del prodotto ha
--    richiesto esplicitamente la cancellazione reale e permanente, accettando
--    la perdita di integrità storica che questo comporta. Si lascia questo
--    commento come traccia della decisione.
-- ============================================================================

alter table personalized_exercises
  add column seen_by_teacher boolean not null default true;

create policy submissions_delete_by_active_teacher
  on submissions for delete
  using (is_active_teacher_of(student_id));
