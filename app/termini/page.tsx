import { AppNav } from '@/components/shared/AppNav'

const NAV_ITEMS = [{ href: '/', label: 'Home' }]

export default function TerminiPage() {
  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main id="main-content" className="mx-auto max-w-2xl p-6 animate-fade-in">
        <h1 className="mb-2 text-2xl font-semibold text-ink-primary">Termini di servizio</h1>
        <p className="mb-6 text-sm text-ink-tertiary">Ultimo aggiornamento: 22 giugno 2026</p>

        <div className="space-y-6 text-sm text-ink-secondary">
          <section>
            <h2 className="mb-2 text-base font-semibold text-ink-primary">1. Il servizio</h2>
            <p>
              Parola è una piattaforma di allenamento per l&apos;italiano, pensata per chiunque
              si prepari a superare standard internazionali di lingua italiana — adolescenti e
              adulti — e per i loro insegnanti. Offre scrittura libera con
              correzione generata da intelligenza artificiale, esercizi personalizzati e
              monitoraggio dei progressi.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink-primary">2. Account e ruoli</h2>
            <p>
              Gli studenti si uniscono tramite un codice fornito dal proprio insegnante. Gli
              account insegnante richiedono l&apos;approvazione di un amministratore prima di
              poter creare classi. Sei responsabile di mantenere riservate le credenziali del
              tuo account.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink-primary">
              3. Uso accettabile
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Usa la piattaforma solo per finalità didattiche</li>
              <li>Non condividere le tue credenziali con altre persone</li>
              <li>Non inviare contenuti offensivi, illegali o estranei all&apos;apprendimento della lingua</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink-primary">
              4. Correzioni generate dall&apos;IA
            </h2>
            <p>
              Le correzioni e gli esercizi sono generati da un modello di intelligenza
              artificiale (Google Gemini) e, come ogni sistema automatico, possono
              occasionalmente contenere imprecisioni. Le valutazioni sono pensate come supporto
              didattico, non come giudizio definitivo o certificazione ufficiale di livello
              linguistico.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink-primary">
              5. Disponibilità del servizio
            </h2>
            <p>
              Facciamo il possibile per mantenere il servizio disponibile, ma non garantiamo
              un funzionamento ininterrotto. Servizi di terze parti (come l&apos;API di
              intelligenza artificiale) possono occasionalmente essere temporaneamente non
              disponibili.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink-primary">6. Modifiche</h2>
            <p>
              Questi termini possono essere aggiornati nel tempo. Continuando a usare Parola
              dopo un aggiornamento, accetti i termini modificati.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink-primary">7. Privacy</h2>
            <p>
              Per informazioni su come trattiamo i tuoi dati, consulta la nostra{' '}
              <a href="/privacy" className="text-brand-400 underline">
                informativa sulla privacy
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </>
  )
}
