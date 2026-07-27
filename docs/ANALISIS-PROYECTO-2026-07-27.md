# Análisis del proyecto Parola (2026-07-27)

Relevamiento del estado real del código en `main` (`3985ae1`), verificado leyendo el repo directamente (no a partir de documentación externa). Complementa lo que ya diga el README, corrigiendo dos discrepancias importantes que se detallan abajo.

## 1. Qué es

Plataforma de aprendizaje de italiano (interfaz 100% en italiano) para adolescentes y adultos que se preparan para exámenes internacionales de italiano, niveles CEFR A1–C2. Tres roles: `student`, `teacher`, `admin`.

Regla de negocio explícita y verificada en múltiples archivos (`lib/gemini/schema.ts:10`, cada prompt en `lib/gemini/prompts/`): **nunca nombrar CILS/CELI/PLIDA** en texto visible al usuario ni en prompts a Gemini — siempre "standard internazionali di lingua italiana". Es casi seguro un requisito legal (uso de marcas de certificación de terceros).

Stack: Next.js 14.2.18 (App Router, Server Components + Server Actions), Supabase (Postgres + RLS, 33 migraciones en `main`), Gemini vía REST directo (no SDK), Tailwind, Vitest, deploy en Vercel.

## 2. Estructura

- **Estudiante** (`app/student/`): escritura libre evaluada por Gemini (puntaje 0–100, nivel CEFR estimado, errores categorizados), **19** componentes de ejercicio de gramática (`Esercizio1.tsx`…`Esercizio19.tsx`), guías de escritura estáticas, ejercicios personalizados asignados por el profesor, página de progreso.
- **Profesor** (`app/teacher/`): clases con código de invitación, dashboard analítico, ficha de alumno con gráfico de evolución y export a PDF, generación de ejercicios a medida según errores reales del alumno.
- **Admin** (`app/admin/users/`): única sección — aprobación/baja de profesores y alumnos, reasignaciones. Es un client component de 753 líneas, el más grande del repo.
- **API**: un solo route handler, `app/api/gemini/evaluate/route.ts`.

~19.150 líneas TS/TSX en `app/`+`components/`+`lib/`.

## 3. Modelo de datos (33 migraciones, todas leídas)

Puntos destacables:

- **Snapshots inmutables**: `submissions` guarda `class_id_at_submission`/`teacher_id_at_submission`, poblados por un trigger agregado recién en la migración 0025 — existían como columnas desde 0001 pero no se escribían durante 24 migraciones.
- **Doble capa contra escalado de privilegios**: la migración 0016 corrige una vulnerabilidad real donde cualquier usuario autenticado podía escribir `role='admin'` en su propio `profiles` llamando directo a la REST API de Supabase (la policy RLS `profiles_update_own` no restringía columnas). Se corrigió con un trigger que bloquea cambios a columnas sensibles para roles no-`service_role`. El mismo patrón de vulnerabilidad existía en `submissions` (alumno podía escribirse su propio `valutazione_ia`) y en `personalized_exercises` (podía escribirse `punteggio_chiuso=100`) — ambas policies fueron eliminadas y las escrituras correspondientes se movieron a admin client server-side.
- **Rate limiting atómico en DB**: `check_submission_rate_limit_atomic` (0026) y `check_login_rate_limit_atomic` (0033) reemplazan un patrón TOCTOU (leer conteo, escribir aparte) por un único `INSERT ... ON CONFLICT DO UPDATE ... RETURNING`. El de login usa hash SHA-256 de la IP, nunca en claro, protegiendo el login por código de acceso contra enumeración.
- **Alumnos sin email** (0031–0032): se registran con un código de 8 caracteres usado como pseudo-email/password de una cuenta Supabase sintética.
- **Historial de "migración que corrige a la migración anterior"**: 0004 corrige 0002, 0017 corrige 0016, 0023/0024 son fixes post-auditoría de race conditions preexistentes (generación de código de invitación, auto-archivado de submissions). Refleja un ciclo real de auditoría de seguridad iterativa — sano en el resultado final, pero sugiere que faltó una revisión de seguridad previa al merge que hubiera evitado introducir estas vulnerabilidades.

## 4. Integración con Gemini

`lib/gemini/client.ts`: REST fetch directo (SDK oficial explícitamente prohibido por comentario en el código). Cascada de 3 modelos por costo:

```
GEMINI_MODEL_PRIMARY   = gemini-2.5-flash-lite
GEMINI_MODEL_FALLBACK  = gemini-3.1-flash-lite
GEMINI_MODEL_FALLBACK_2 = gemini-2.5-flash
```

Distingue cuota agotada (`RESOURCE_EXHAUSTED`, no reintentable con backoff corto) de sobrecarga transitoria. Structured outputs vía `responseSchema` nativo de Gemini, generado desde schemas Zod con un conversor manual (`zodToGeminiSchema()`, subconjunto de Zod soportado, falla explícito si aparece un tipo no cubierto) y validado con `safeParse` antes de persistir. Sanitización anti prompt-injection en dos implementaciones algo distintas (`examinador.ts` vs `struttura.ts`) — funcional pero duplicada.

`lib/gemini/prompts/struttura.ts` tiene **1623 líneas** — el archivo más grande del repo por lejos, con 19 pares `generate/evaluate` casi idénticos en estructura.

## 5. Hallazgo crítico verificado: los ejercicios 7–19 probablemente rompen en runtime

Esto lo verifiqué yo directamente, no es una inferencia del relevamiento inicial:

El enum de Postgres `submission_type` (`supabase/migrations/0001_schema_base.sql:14`) solo tiene valores hasta `esercizio_struttura_6` (agregados en `0014_esercizi_cils_fedeli.sql`). No hay ninguna otra migración en el repo que extienda ese enum.

Sin embargo, `app/student/exercises/actions.ts` inserta en `submissions.tipo` los valores `esercizio_struttura_7` hasta `esercizio_struttura_19` (líneas 219 a 489) — **13 valores que no existen en el enum versionado**. Además, `lib/supabase/database.types.ts` (que dice explícitamente "mantener sincronizado manualmente") ni siquiera declara los tipos `_5`/`_6`, solo hasta `_4`.

Dos posibilidades:
1. El Supabase real en producción tiene el enum extendido manualmente (fuera de `supabase/migrations/`), y hay drift de schema no versionado — riesgo serio si algún día se recrea la base desde las migraciones.
2. El enum no está extendido en producción, y **completar cualquiera de los ejercicios 7 a 19 falla con un error de Postgres** ("invalid input value for enum submission_type") en el momento de guardar la submission.

**Esto conviene verificarlo cuanto antes contra la base real** — es independiente de los 5 commits pendientes de traer del bundle, y si es el caso (2), es un bug de producción activo, no una mejora a futuro.

## 6. Repetición de código: los 19 componentes de ejercicio

Comparé `Esercizio1.tsx` y `Esercizio2.tsx` línea por línea: comparten casi exactamente la misma máquina de estados (`idle/generando/rispondendo/valutando/pronto/errore`), mismos handlers, misma estructura JSX. Solo cambia el tipo de dato mostrado. `Esercizio2.tsx` incluso importa el componente `Risultati` exportado desde `Esercizio1.tsx` en vez de tener un módulo compartido — acoplamiento cruzado entre archivos que deberían ser independientes.

Bug de accesibilidad encontrado en 10 de los 19 archivos: un `aria-label` roto, por ejemplo `Esercizio1.tsx:82` literalmente contiene `` aria-label={`Risposta <input `` (código JSX pegado a medias dentro del string) y `Esercizio9.tsx:117` tiene `` aria-label={`Risposta `} `` (string vacío después de "Risposta"). Afecta lectores de pantalla en los inputs de esos ejercicios. Parece un artefacto de generación/edición automática que quedó sin revisar.

## 7. Autenticación y autorización

Doble capa deliberada y bien documentada en el propio código: el `middleware.ts` protege el render de páginas (matcher acotado a `/student`, `/teacher`, `/admin`, `/account` — deliberadamente excluye rutas públicas para no pagar el round-trip de `auth.getUser()` en home/privacy/etc), pero **no protege Server Actions invocadas directamente**. Por eso `lib/student/guard.ts` y `lib/teacher/guard.ts` repiten la verificación de rol + estado (`approved`/`pending`/`disabled`) al inicio de cada Server Action — el comentario en `lib/teacher/guard.ts:38-46` documenta explícitamente el bug real que esto corrige: un profesor deshabilitado con sesión abierta podía seguir creando clases si invocaba la Server Action directamente, sin pasar por el render de la página.

## 8. Testing

4 archivos de test, 323 líneas — cubren solo lógica pura: `lib/guides.ts`, `lib/analytics/studentStats.ts`, `isQuotaExhausted()` de `lib/gemini/client.ts`, y schemas Zod. **Cero tests** sobre Server Actions (2781 líneas entre todos los `actions.ts` del repo), el route handler de evaluación, los guards de autorización, `middleware.ts`, o las 1623 líneas de `lib/gemini/prompts/struttura.ts`. No hay medición de cobertura configurada.

## 9. Infraestructura

- No existe `.github/` — no hay CI. `type-check`, `lint`, `test` dependen de que alguien se acuerde de correrlos.
- `next.config.js` tiene buenos headers de seguridad (X-Frame-Options, HSTS, nosniff, Permissions-Policy) pero **no tiene Content-Security-Policy**, relevante porque la app renderiza texto generado por IA y escrito por alumnos.
- `public/manifest.json` existe pero no hay service worker — PWA a medias, sin funcionalidad offline.

## 10. Deuda técnica

Declarada en el README: guías de escritura estáticas (pendiente generarlas con IA), rate limiting en DB en vez de infraestructura dedicada (aceptado como suficiente para el volumen actual).

No declarada, encontrada en este relevamiento:
- README desactualizado en dos puntos concretos: dice "4 tipi di esercizio" (son 19) y dice que el modelo es solo `gemini-2.5-flash` (son 3 en cascada, incluyendo `gemini-3.1-flash-lite`, un nombre que vale la pena confirmar que existe realmente en el catálogo de Gemini).
- El enum `submission_type` desincronizado con el código (sección 5) — el hallazgo más urgente de este documento.
- `lib/supabase/database.types.ts` desactualizado respecto a las migraciones reales.
- Bug de `aria-label` en 10 de 19 componentes de ejercicio (sección 6).

## Resumen

Es un proyecto maduro para su tamaño: las decisiones de seguridad difíciles están tomadas y documentadas en el propio código (guards duplicados a propósito, snapshots inmutables, rate limiting atómico), y la deuda declarada es menor y realista. El problema principal no es de diseño sino de **sincronización entre código y schema versionado**: el enum `submission_type` desactualizado es un bug potencial activo, no solo deuda técnica, y merece verificarse contra la base real antes que cualquier otra mejora.
