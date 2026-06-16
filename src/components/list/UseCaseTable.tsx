import { useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  ColumnOrderState,
  GroupingState,
  ExpandedState,
} from '@tanstack/react-table'
import {
  AIUseCase, Status, AIApproach, Department,
  STATUS_BG, APPROACH_BG, FEASIBILITY_BG,
  STATUSES, AI_APPROACHES, DEPARTMENTS,
} from '../../types'
import { computeROI, scoreBg } from '../../lib/scoring'
import { exportToCSV } from '../../lib/csvExport'
import { useUseCasesStore } from '../../store/useCasesStore'

const ch = createColumnHelper<AIUseCase>()

const GROUP_OPTIONS = [
  { value: '', label: 'No grouping' },
  { value: 'department', label: 'Department' },
  { value: 'status', label: 'Status' },
  { value: 'aiApproach', label: 'AI Approach' },
]

export default function UseCaseTable() {
  const { useCases, deleteUseCase, duplicateUseCase } = useUseCasesStore()
  const navigate = useNavigate()

  const [sorting, setSorting] = useState<SortingState>([{ id: 'priorityScore', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    dataRequirements: false,
    teamCompetencies: false,
    timeline: false,
    successMetrics: false,
  })
  const [grouping, setGrouping] = useState<GroupingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>(true)
  const [showColMenu, setShowColMenu] = useState(false)
  const [groupBy, setGroupBy] = useState('')

  // Column drag-reorder
  const allColumnIds = [
    'title', 'department', 'status', 'aiApproach', 'technicalFeasibility',
    'businessImpact', 'feasibility', 'strategicFit', 'urgency', 'priorityScore',
    'estimatedCostK', 'expectedBenefitK', 'roi',
    'successMetrics', 'dataRequirements', 'teamCompetencies', 'timeline',
    'actions',
  ]
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(allColumnIds)
  const dragColId = useRef<string | null>(null)

  const columns = useMemo(() => [
    ch.accessor('title', {
      header: 'Title',
      cell: (i) => (
        <button
          onClick={() => navigate(`/canvas/${i.row.original.id}`)}
          className="text-blue-600 hover:underline font-medium text-left"
        >
          {i.getValue()}
        </button>
      ),
    }),
    ch.accessor('department', {
      header: 'Department',
      filterFn: 'equals',
    }),
    ch.accessor('status', {
      header: 'Status',
      filterFn: 'equals',
      cell: (i) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BG[i.getValue() as Status]}`}>
          {i.getValue()}
        </span>
      ),
    }),
    ch.accessor('aiApproach', {
      header: 'AI Approach',
      filterFn: 'equals',
      cell: (i) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${APPROACH_BG[i.getValue() as AIApproach]}`}>
          {i.getValue()}
        </span>
      ),
    }),
    ch.accessor('technicalFeasibility', {
      header: 'Feasibility',
      cell: (i) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${FEASIBILITY_BG[i.getValue()]}`}>
          {i.getValue()}
        </span>
      ),
    }),
    ch.accessor('businessImpact', { header: 'Impact', cell: (i) => <ScoreCell v={i.getValue()} /> }),
    ch.accessor('feasibility', { header: 'Feasibility Score', cell: (i) => <ScoreCell v={i.getValue()} /> }),
    ch.accessor('strategicFit', { header: 'Strategic Fit', cell: (i) => <ScoreCell v={i.getValue()} /> }),
    ch.accessor('urgency', { header: 'Urgency', cell: (i) => <ScoreCell v={i.getValue()} /> }),
    ch.accessor('priorityScore', {
      header: 'Priority Score',
      cell: (i) => {
        const v = i.getValue()
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${scoreBg(v)}`} style={{ width: `${(v / 10) * 100}%` }} />
            </div>
            <span className="text-sm font-semibold text-slate-700">{v}</span>
          </div>
        )
      },
    }),
    ch.accessor('estimatedCostK', {
      header: 'Cost (€k)',
      cell: (i) => <span className="text-slate-600">€{i.getValue()}k</span>,
    }),
    ch.accessor('expectedBenefitK', {
      header: 'Benefit (€k/yr)',
      cell: (i) => <span className="text-green-600 font-medium">€{i.getValue()}k</span>,
    }),
    ch.display({
      id: 'roi',
      header: '3-Yr ROI',
      cell: (i) => {
        const roi = computeROI(i.row.original.estimatedCostK, i.row.original.expectedBenefitK)
        return (
          <span className={`font-medium ${roi > 200 ? 'text-green-600' : roi > 0 ? 'text-amber-600' : 'text-red-500'}`}>
            {roi}%
          </span>
        )
      },
    }),
    ch.accessor('successMetrics', { header: 'Success Metrics' }),
    ch.accessor('dataRequirements', { header: 'Data Requirements' }),
    ch.accessor('teamCompetencies', { header: 'Team Competencies' }),
    ch.accessor('timeline', { header: 'Timeline' }),
    ch.display({
      id: 'actions',
      header: '',
      enableHiding: false,
      cell: (i) => (
        <div className="flex items-center gap-1">
          <ActionBtn label="✏️" title="Edit" onClick={() => navigate(`/canvas/${i.row.original.id}`)} />
          <ActionBtn label="📋" title="Duplicate" onClick={() => duplicateUseCase(i.row.original.id)} />
          <ActionBtn
            label="🗑️"
            title="Delete"
            onClick={() => {
              if (confirm(`Delete "${i.row.original.title}"?`)) deleteUseCase(i.row.original.id)
            }}
          />
        </div>
      ),
    }),
  ], [navigate, deleteUseCase, duplicateUseCase])

  const table = useReactTable({
    data: useCases,
    columns,
    state: { sorting, columnFilters, globalFilter, columnVisibility, columnOrder, grouping, expanded },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    globalFilterFn: 'includesString',
  })

  const handleGroupByChange = (value: string) => {
    setGroupBy(value)
    setGrouping(value ? [value] : [])
    if (value) setExpanded(true)
  }

  // Per-column filters for dropdown fields
  const deptFilter = (columnFilters.find((f) => f.id === 'department')?.value as string) ?? ''
  const statusFilter = (columnFilters.find((f) => f.id === 'status')?.value as string) ?? ''
  const approachFilter = (columnFilters.find((f) => f.id === 'aiApproach')?.value as string) ?? ''

  const setFilter = (colId: string, val: string) => {
    setColumnFilters((prev) => {
      const without = prev.filter((f) => f.id !== colId)
      return val ? [...without, { id: colId, value: val }] : without
    })
  }

  const hasActiveFilters = globalFilter !== '' || columnFilters.length > 0 || groupBy !== ''

  const clearAllFilters = () => {
    setGlobalFilter('')
    setColumnFilters([])
    handleGroupByChange('')
  }

  const hideable = table.getAllLeafColumns().filter((c) => c.getCanHide())

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
          </svg>
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search all columns…"
            className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>

        {/* Filters */}
        <FilterSelect
          value={statusFilter}
          onChange={(v) => setFilter('status', v)}
          options={STATUSES}
          placeholder="All statuses"
        />
        <FilterSelect
          value={deptFilter}
          onChange={(v) => setFilter('department', v)}
          options={DEPARTMENTS}
          placeholder="All departments"
        />
        <FilterSelect
          value={approachFilter}
          onChange={(v) => setFilter('aiApproach', v)}
          options={AI_APPROACHES}
          placeholder="All AI types"
        />

        {/* Group by */}
        <select
          value={groupBy}
          onChange={(e) => handleGroupByChange(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        >
          {GROUP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear filters
          </button>
        )}

        <div className="flex-1" />

        {/* Column visibility */}
        <div className="relative">
          <button
            onClick={() => setShowColMenu((v) => !v)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 shadow-sm"
          >
            Columns ▾
          </button>
          {showColMenu && (
            <div className="absolute right-0 top-9 z-20 bg-white rounded-xl shadow-xl p-3 w-52 space-y-1">
              {hideable.map((col) => (
                <label key={col.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer py-0.5">
                  <input
                    type="checkbox"
                    checked={col.getIsVisible()}
                    onChange={col.getToggleVisibilityHandler()}
                    className="accent-blue-600"
                  />
                  {typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* CSV export */}
        <button
          onClick={() => exportToCSV(useCases)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
          Export CSV
        </button>

        {/* Count */}
        <span className="text-sm text-slate-400">
          {table.getFilteredRowModel().rows.length} of {useCases.length}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-md">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    draggable={header.id !== 'actions'}
                    onDragStart={() => { dragColId.current = header.id }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      const from = dragColId.current
                      const to = header.id
                      if (!from || from === to) return
                      setColumnOrder((prev) => {
                        const arr = [...prev]
                        const fi = arr.indexOf(from)
                        const ti = arr.indexOf(to)
                        arr.splice(fi, 1)
                        arr.splice(ti, 0, from)
                        return arr
                      })
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap select-none ${
                      header.column.getCanSort() ? 'cursor-pointer hover:bg-slate-100' : ''
                    }`}
                  >
                    {header.isPlaceholder ? null : (
                      <span className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="inline-flex flex-col gap-px ml-0.5">
                            {header.column.getIsSorted() === 'asc' ? (
                              <svg className="w-3 h-3 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-8 8h16z"/></svg>
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <svg className="w-3 h-3 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l8-8H4z"/></svg>
                            ) : (
                              <span className="inline-flex flex-col gap-px opacity-30">
                                <svg className="w-2.5 h-2.5 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-7 7h14z"/></svg>
                                <svg className="w-2.5 h-2.5 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l7-7H5z"/></svg>
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-200">
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-slate-400">
                  No use cases match the current filters.
                </td>
              </tr>
            )}
            {table.getRowModel().rows.map((row) => {
              if (row.getIsGrouped()) {
                return (
                  <tr key={row.id} className="bg-slate-50 border-y border-slate-200">
                    <td
                      colSpan={table.getVisibleLeafColumns().length}
                      className="px-3 py-2"
                    >
                      <button
                        onClick={row.getToggleExpandedHandler()}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                      >
                        <span>{row.getIsExpanded() ? '▼' : '▶'}</span>
                        <span>{String(row.groupingValue)}</span>
                        <span className="font-normal text-slate-400">({row.subRows.length} cases)</span>
                      </button>
                    </td>
                  </tr>
                )
              }
              return (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={`px-3 py-2.5 text-slate-700 ${cell.column.id === 'title' ? 'min-w-[200px]' : 'max-w-[220px] truncate'}`}>
                      {cell.getIsGrouped() ? (
                        <button onClick={row.getToggleExpandedHandler()} className="font-medium">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())} ({row.subRows.length})
                        </button>
                      ) : cell.getIsAggregated() ? null : (
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ScoreCell({ v }: { v: number }) {
  const color = v >= 8 ? 'text-green-600' : v >= 6 ? 'text-amber-600' : v >= 4 ? 'text-orange-500' : 'text-red-500'
  return <span className={`font-semibold ${color}`}>{v}</span>
}

function ActionBtn({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="p-1 rounded hover:bg-slate-100 leading-none text-base"
    >
      {label}
    </button>
  )
}

function FilterSelect({
  value, onChange, options, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: readonly string[]
  placeholder: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}
