# Parola

Piattaforma di apprendimento dell'italiano per adolescenti, pensata per
preparare gli studenti a superare esami internazionali di lingua italiana.

## Stack

- Next.js 14 (App Router)
- Supabase (auth + database)
- Gemini API via REST fetch diretto (mai SDK ufficiale), modello `gemini-3.5-flash`
- Tailwind CSS con design tokens semantici (dark mode incluso)
- Deploy su Vercel

## Regole critiche del progetto

- **Mai nominare CILS, CELI, PLIDA** in nessuna stringa visibile all'utente.
  Usare sempre "standard internazionali" o "esami internazionali di lingua
  italiana".
- **Tutto il testo dell'interfaccia è in italiano.**
- `createAdminClient()` (in `lib/supabase/admin.ts`) per qualsiasi lettura
  cross-user (insegnante che vede i propri studenti, admin che gestisce
  insegnanti). Non usare mai questo client lato browser.
- Le classi sono create liberamente dall'insegnante (nome libero, es. "1°
  Anno", "Preparazione standard internazionali") con codice di invito
  generato automaticamente. L'admin non crea classi.
- L'admin approva/rifiuta nuovi insegnanti, può disabilitare (reversibile) o
  eliminare (definitivo, richiede conferma con il nome esatto) un insegnante
  — solo dopo aver riassegnato manualmente tutte le sue classi/studenti
  (vincolo applicato sia a livello DB con `ON DELETE RESTRICT` su
  `classes.teacher_id`, sia a livello applicativo).
- L'insegnante può spostare i propri studenti tra le proprie classi.
- Lo storico dello studente (submissions, exercises) non si perde mai in una
  riassegnazione o spostamento: `submissions` referenzia `student_id`
  direttamente e mantiene uno snapshot di classe/insegnante al momento
  dell'invio.

## Setup locale

```bash
npm install
cp .env.example .env.local
# completa .env.local con le credenziali Supabase e Gemini
npm run dev
```

## Database

Le migrazioni SQL sono in `supabase/migrations/`. Applicarle nel progetto
Supabase prima del primo avvio (in ordine numerico):

1. `0001_schema_base.sql` — tabelle, trigger, funzioni
2. `0002_rls_policies.sql` — Row Level Security per ruolo

## Struttura

```
app/
  (auth)/login, registrati       — accesso e registrazione con codice classe
  student/write                  — scrittura libera + valutazione esaminatore
  student/exercises              — analisi delle strutture (4 tipi)
  student/guides                 — guide di scrittura, modalità guidata
  teacher/classes                — gestione classi dell'insegnante
  admin/users                    — approvazione e gestione insegnanti
  api/                           — route handlers
components/
  ui/                            — primitivi (Button, Card)
  shared/                        — personaggio Parola, elementi condivisi
lib/
  supabase/                      — client browser, server, admin, tipi DB
  gemini/                        — client REST, prompt dell'esaminatore
supabase/
  migrations/                    — schema SQL + RLS
```

## Stato del progetto

Scaffolding iniziale + architettura backend (schema, RLS, integrazione
Gemini). Le pagine in `app/` sono placeholder con `TODO` che indicano la
logica da implementare. Pendenti note:

- Server Actions di onboarding (registrazione studente/insegnante)
- Endpoint admin (approva/rifiuta/disabilita/elimina insegnante, riassegna
  studente)
- `lib/gemini/prompts/struttura.ts` — contratto dei 4 tipi di esercizio
  (da definire)
