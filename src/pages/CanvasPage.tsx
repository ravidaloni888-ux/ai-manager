import { useParams } from 'react-router-dom'
import { useUseCasesStore } from '../store/useCasesStore'
import CanvasForm from '../components/canvas/CanvasForm'

export default function CanvasPage() {
  const { id } = useParams<{ id: string }>()
  const getById = useUseCasesStore((s) => s.getById)
  const existing = id && id !== 'new' ? getById(id) : undefined

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <CanvasForm existing={existing} />
    </div>
  )
}
