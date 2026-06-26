-- ============================================================================
-- Parola — Migración 0010: tipi di esercizio personalizzato (libri di testo)
--
-- Estende personalized_exercises per supportare tipi a risposta chiusa
-- (completamento, scelta multipla, abbinamento, trasformazione) oltre alla
-- scrittura libera originale. Per i tipi chiusi, la correzione è
-- deterministica (confronto risposta studente vs risposta_corretta) e NON
-- passa per submissions/Gemini evaluate — si salva direttamente qui.
-- ============================================================================

alter table personalized_exercises
  add column tipo_esercizio text not null default 'scrittura',
  add column items jsonb,
  add column risposte_studente jsonb,
  add column punteggio_chiuso integer,
  add column completato_at timestamptz;

alter table personalized_exercises
  add constraint personalized_exercises_tipo_check
  check (tipo_esercizio in ('scrittura', 'completamento', 'scelta_multipla', 'abbinamento', 'trasformazione'));

comment on column personalized_exercises.items is
  'Solo per tipi a risposta chiusa: array di {domanda, opzioni, risposta_corretta, spiegazione_risposta}. NULL per tipo scrittura.';
comment on column personalized_exercises.risposte_studente is
  'Risposte date dallo studente per i tipi a risposta chiusa, stesso ordine di items. NULL finché non risponde.';
comment on column personalized_exercises.punteggio_chiuso is
  'Percentuale di risposte corrette (0-100) per i tipi a risposta chiusa, calcolata lato client al momento della consegna.';
