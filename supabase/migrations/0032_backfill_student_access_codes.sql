-- Genera access_code para los estudiantes existentes que no tienen uno.
-- Usa el mismo charset que el código TypeScript (sin 0/O/1/I para evitar
-- confusiones visuales): ABCDEFGHJKLMNPQRSTUVWXYZ23456789

CREATE OR REPLACE FUNCTION _generate_access_code() RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  text := '';
  bytes bytea;
  i     int;
BEGIN
  bytes := gen_random_bytes(8);
  FOR i IN 0..7 LOOP
    code := code || substr(chars, (get_byte(bytes, i) % length(chars)) + 1, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Assegna un codice unico a ogni studente senza codice, ritentando in caso
-- di collisione (praticamente impossibile ma gestita per correttezza).
DO $$
DECLARE
  rec    record;
  code   text;
  ok     bool;
BEGIN
  FOR rec IN
    SELECT id FROM profiles WHERE role = 'student' AND access_code IS NULL
  LOOP
    ok := false;
    WHILE NOT ok LOOP
      code := _generate_access_code();
      BEGIN
        UPDATE profiles SET access_code = code WHERE id = rec.id;
        ok := true;
      EXCEPTION WHEN unique_violation THEN
        -- collisione: riprova con un nuovo codice
        NULL;
      END;
    END LOOP;
  END LOOP;
END;
$$;

DROP FUNCTION _generate_access_code();
