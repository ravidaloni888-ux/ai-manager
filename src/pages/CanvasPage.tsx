import { useParams } from 'react-router-dom'
import { useUseCasesStore } from '../store/useCasesStore'
import CanvasForm from '../components/canvas/CanvasForm'
import NewCaseWizard from '../components/canvas/NewCaseWizard'

export default function CanvasPage() {
  const { id } = useParams<{ id: string }>()
  const getById = useUseCasesStore((s) => s.getById)
  const existing = id && id !== 'new' ? getById(id) : undefined

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
      {/* Der To-do-Plan lebt in „Prüfungen zu diesem Fall" — kein eigener Block mehr */}
      <CanvasForm existing={existing} />
    </div>
  )
}
