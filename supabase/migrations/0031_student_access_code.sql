-- Codice di accesso personale per gli studenti senza email/password.
-- Formato: 8 caratteri alfanumerici maiuscoli (es. A7K2XM9P).
-- Usato come pseudo-email ({code}@student.parola.internal) e come password
-- nell'account Supabase Auth sintetico creato alla registrazione.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS access_code text UNIQUE;

-- Solo gli studenti con account sintetico avranno questo campo popolato.
-- Gli insegnanti lo avranno NULL.
