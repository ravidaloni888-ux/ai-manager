import { useNavigate } from 'react-router-dom'
import UseCaseTable from '../components/list/UseCaseTable'

export default function ListPage() {
  const navigate = useNavigate()

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Use Cases</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Sort, filter, group, and manage your AI portfolio. Drag column headers to reorder.
          </p>
        </div>
        <button
          onClick={() => navigate('/canvas/new')}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
        >
          + New Use Case
        </button>
      </div>

      <UseCaseTable />
    </div>
  )
}
