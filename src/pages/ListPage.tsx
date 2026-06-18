import { useNavigate } from 'react-router-dom'
import UseCaseTable from '../components/list/UseCaseTable'
import { useAuthStore } from '../store/authStore'

export default function ListPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Use Cases</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Sort, filter, group and manage your AI portfolio.
          </p>
        </div>
      </div>

      <UseCaseTable />
    </div>
  )
}
