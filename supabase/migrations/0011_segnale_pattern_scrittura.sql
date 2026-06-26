-- ============================================================================
-- Parola — Migración 0012: señales de patrón de escritura (no veredicto)
--
-- Registra dos hechos neutrales sobre cómo se produjo un texto de
-- scrittura libera: si se pegó contenido grande de una vez, y cuánto
-- tiempo estuvo el alumno en la página antes de entregar. NO es un
-- detector de IA ni de plagio — es información que el docente puede
-- considerar junto con todo lo demás que ya conoce del alumno. La UI
-- nunca debe presentar esto como una acusación o veredicto automático.
-- ============================================================================

alter table submissions
  add column testo_incollato boolean not null default false,
  add column secondi_scrittura integer;

comment on column submissions.testo_incollato is
  'true si se detectó un evento de pegado que añadió una porción significativa del texto final. Señal neutral para el docente, no una acusación de plagio/IA.';
comment on column submissions.secondi_scrittura is
  'Segundos transcurridos entre la primera interacción con el campo de texto y el envío. NULL si no se pudo medir.';
