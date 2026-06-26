-- ============================================================================
-- Parola — Migración 0013: controllo amministratore completo sugli studenti
--
-- Estende student_status con 'disabled' (l'admin può disabilitare QUALSIASI
-- studente, non solo gli indipendenti pending) e ripristina i dati esistenti
-- per evitare di bloccare per errore studenti già attivi con un insegnante
-- (introdotti prima della migrazione 0012, quindi con student_status NULL).
-- ============================================================================

alter type student_status add value 'disabled';

-- Backfill: cualquier estudiante existente sin student_status (se unió con
-- código de profesor antes de esta migración) queda aprobado explícitamente
-- — nunca debe perder acceso por un cambio de esquema retroactivo.
update profiles
set student_status = 'approved'
where role = 'student' and student_status is null;
