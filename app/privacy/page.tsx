import Link from 'next/link'
import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'

const NAV_ITEMS = [{ href: '/', label: 'Home' }]

export default function PrivacyPage() {
  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main id="main-content" className="mx-auto max-w-2xl p-6 animate-fade-in">
        <h1 className="mb-2 text-2xl font-semibold text-ink-primary">Informativa sulla privacy</h1>
        <p className="mb-6 text-sm text-ink-tertiary">
          Ultimo aggiornamento: 22 giugno 2026
        </p>

        <Card className="mb-6 bg-warning-bg">
          <p className="text-sm text-warning-text">
            <strong>Nota importante:</strong> Parola è una piattaforma di allenamento aperta a
            chiunque si prepari a un esame internazionale di lingua italiana — adolescenti e
            adulti. Se sei minorenne, ti chiediamo di usare la piattaforma con il consenso di un
            genitore, tutore o insegnante responsabile. Questa informativa descrive in modo
            chiaro quali dati raccogliamo e perché — non è una consulenza legale formale;
            chi gestisce un&apos;istituzione che usa Parola con minori dovrebbe verificare gli
            obblighi specifici della propria giurisdizione (es. consenso parentale, COPPA,
            GDPR per i minori).
          </p>
        </Card>

        <div className="space-y-6 text-sm text-ink-secondary">
          <section>
            <h2 className="mb-2 text-base font-semibold text-ink-primary">
              1. Quali dati raccogliamo
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Email, nome e cognome forniti al momento della registrazione</li>
              <li>Ruolo (studente, insegnante) e, per gli studenti, il livello linguistico target</li>
              <li>
                I testi che scrivi sulla piattaforma (scrittura libera, risposte agli esercizi) e
                le correzioni/valutazioni generate
              </li>
              <li>Data e ora degli accessi, per permettere all&apos;insegnante di seguire i progressi</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink-primary">
              2. Come usiamo l&apos;intelligenza artificiale
            </h2>
            <p>
              I testi che scrivi vengono inviati all&apos;API di Google Gemini per generare
              correzioni linguistiche ed esercizi personalizzati. Google elabora questi testi
              come fornitore di servizi per Parola, secondo i propri termini per l&apos;API
              Gemini. Non condividiamo i tuoi testi con nessun altro scopo che non sia la
              correzione didattica.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink-primary">
              3. Chi può vedere i tuoi dati
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Lo studente</strong> vede solo i propri testi, correzioni e progressi
              </li>
              <li>
                <strong>L&apos;insegnante</strong> a cui sei assegnato vede i testi, le
                correzioni, l&apos;ultimo accesso e le statistiche di progresso dei propri
                studenti — non quelli di altri insegnanti
              </li>
              <li>
                <strong>L&apos;amministratore</strong> della piattaforma può gestire account e
                approvazioni, ma non usa i tuoi testi per altri scopi
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink-primary">
              4. Dove sono conservati i dati
            </h2>
            <p>
              I dati sono conservati su Supabase (database e autenticazione) e l&apos;applicazione
              è ospitata su Vercel. Entrambi i fornitori applicano misure di sicurezza standard
              del settore (cifratura in transito, accesso controllato).
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink-primary">5. Cookie</h2>
            <p>
              Usiamo solo cookie tecnici necessari per mantenere la sessione di accesso. Non
              utilizziamo cookie di tracciamento pubblicitario né analytics di terze parti.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink-primary">6. I tuoi diritti</h2>
            <p>
              Puoi richiedere in qualsiasi momento di vedere, correggere o eliminare i tuoi
              dati. Per farlo, contatta il tuo insegnante o l&apos;amministratore della
              piattaforma. Gli studenti possono modificare nome e cognome direttamente dalla
              propria pagina <Link href="/account" className="text-brand-400 underline">Account</Link>.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink-primary">7. Contatti</h2>
            <p>
              Per qualsiasi domanda su questa informativa o sui tuoi dati, contatta
              l&apos;insegnante o l&apos;istituzione che ti ha invitato su Parola.
            </p>
          </section>
        </div>
      </main>
    </>
  )
}
