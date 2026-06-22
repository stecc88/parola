-- ============================================================================
-- Parola — Migración 0007: consegna data dallo studente in scrittura libera
-- ============================================================================
-- Permette allo studente di inserire la consegna ricevuta dal docente
-- (modalità esame). Si salva insieme alla submission per:
--   1. Mantenere lo storico di cosa è stato chiesto allo studente
--   2. Permettere all'IA di verificare se il testo rispetta ogni punto
--      richiesto dalla consegna
-- Nullable: la scrittura libera senza consegna (o con guida predefinita)
-- resta valida.

alter table submissions add column consegna text;
