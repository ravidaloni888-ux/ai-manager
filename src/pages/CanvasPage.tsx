import { useParams } from 'react-router-dom'
import { useUseCasesStore } from '../store/useCasesStore'
import CanvasForm from '../components/canvas/CanvasForm'
import { ProjectPlanContent } from './ProjectPlanPage'

export default function CanvasPage() {
  const { id } = useParams<{ id: string }>()
  const getById = useUseCasesStore((s) => s.getById)
  const existing = id && id !== 'new' ? getById(id) : undefined

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-10">
      <CanvasForm existing={existing} />
      {existing && (
        <div className="border-t border-slate-200 pt-8">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Compliance-Projektplan</h2>
          <p className="text-sm text-slate-500 mb-6">Beantworte die Fragen und erhalte einen maßgeschneiderten To-do-Plan für diesen Use Case.</p>
          <ProjectPlanContent ucid={existing.id} />
        </div>
      )}
    </div>
  )
}
