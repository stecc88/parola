-- ============================================================================
-- Parola — Migración 0014: due nuovi tipi di esercizio fedeli al formato CILS
--
-- Aggiunge i due tipi di "Analisi delle strutture di comunicazione" che
-- ancora mancavano per coprire le 4 prove reali di questa sezione
-- dell'esame: completamento lessicale a scelta multipla e situazioni
-- comunicative. I 4 tipi già esistenti (completamento, riordino,
-- preposizioni, trasformazione) restano invariati — qui si aggiunge,
-- non si sostituisce nulla.
-- ============================================================================

alter type submission_type add value 'esercizio_struttura_5';
alter type submission_type add value 'esercizio_struttura_6';
