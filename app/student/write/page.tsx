import { Card } from '@/components/ui/Card'

export default function WritePage() {
  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Scrittura libera</h1>
      <Card>
        {/*
          TODO:
          1. Textarea para testo_studente
          2. Server Action: crea submission (tipo='scrittura_libera', valutazione_ia=NULL)
          3. POST a /api/gemini/evaluate con el submissionId devuelto
          4. Mostrar valutazione_ia cuando llegue (punteggio, livello, errori, feedback)
        */}
      </Card>
    </main>
  )
}
