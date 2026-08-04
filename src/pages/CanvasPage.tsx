import { useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useUseCasesStore } from '../store/useCasesStore'
import CanvasForm from '../components/canvas/CanvasForm'
import NewCaseWizard from '../components/canvas/NewCaseWizard'

export default function CanvasPage() {
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const getById = useUseCasesStore((s) => s.getById)
  const existing = id && id !== 'new' ? getById(id) : undefined

  // Aus dem geführten Modus kommend: an die passende Stelle springen.
  // „bewertung" ist der eigene Canvas-Block, alles andere der Fall-Wizard.
  const check = params.get('check')
  // An der ID hängen, nicht am Objekt — sonst setzt jeder Store-Schreibvorgang
  // den Effekt neu auf und der Timer kommt nie zum Zug.
  const gefunden = !!existing
  useEffect(() => {
    if (!check || !gefunden) return
    const ziel = check === 'bewertung' ? 'bewertung' : 'fall-wizard'

    // Die Unterkomponenten rendern verzögert — auf das Element warten,
    // statt auf eine feste Frist zu hoffen.
    let versuche = 0
    const timer = window.setInterval(() => {
      const el = document.getElementById(ziel)
      if (el) {
        // kein 'smooth': wird bei reduzierter Bewegung teils komplett ignoriert
        el.scrollIntoView({ block: 'start' })
        window.clearInterval(timer)
      } else if (++versuche > 30) {
        window.clearInterval(timer)
      }
    }, 100)
    return () => window.clearInterval(timer)
  }, [check, gefunden, id])

  // Neu anlegen läuft über den Wizard — der fragt alles ab, was der Plan braucht
  if (!existing) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <NewCaseWizard />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Der To-do-Plan lebt im Fall-Wizard — kein eigener Block mehr */}
      <CanvasForm existing={existing} />
    </div>
  )
}
