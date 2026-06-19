import { useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────
type Category = 'Foundation Model' | 'ML Platform' | 'AI Automation' | 'Data & Analytics'
type Pricing  = 'Pay-per-use' | 'Subscription' | 'Enterprise' | 'Open Source'

interface Vendor {
  id: string
  name: string
  vendor: string
  category: Category
  description: string
  website: string
  pricingModel: Pricing
  scores: {
    capability:      number // 1–5
    integration:     number
    dataPrivacy:     number
    support:         number
    costEfficiency:  number
  }
  euDataResidency: boolean | 'Partial'
  gdprReady:   boolean
  onPremise:   boolean
  apiAccess:   boolean
  fineTuning:  boolean
  contextWindowK: number | null // thousands of tokens
  bestFor: string
  tags: string[]
}

// ── Vendor data ────────────────────────────────────────────────────────────
const VENDORS: Vendor[] = [
  {
    id: 'openai',
    name: 'GPT-4o / o1',
    vendor: 'OpenAI',
    category: 'Foundation Model',
    description: 'Industry-leading large language models with strong reasoning, vision, and code generation. Widely adopted across enterprise use cases.',
    website: 'https://openai.com',
    pricingModel: 'Pay-per-use',
    scores: { capability: 5, integration: 4, dataPrivacy: 3, support: 4, costEfficiency: 3 },
    euDataResidency: 'Partial',
    gdprReady: true,
    onPremise: false,
    apiAccess: true,
    fineTuning: true,
    contextWindowK: 128,
    bestFor: 'General-purpose LLM tasks, summarisation, code, reasoning',
    tags: ['LLM', 'Vision', 'Code', 'Reasoning'],
  },
  {
    id: 'anthropic',
    name: 'Claude (Sonnet / Opus)',
    vendor: 'Anthropic',
    category: 'Foundation Model',
    description: 'Safety-focused LLMs with excellent instruction-following, long context, and document analysis. Strong EU enterprise data agreements available.',
    website: 'https://www.anthropic.com',
    pricingModel: 'Pay-per-use',
    scores: { capability: 5, integration: 4, dataPrivacy: 4, support: 4, costEfficiency: 3 },
    euDataResidency: 'Partial',
    gdprReady: true,
    onPremise: false,
    apiAccess: true,
    fineTuning: false,
    contextWindowK: 200,
    bestFor: 'Document analysis, long-context tasks, safety-critical applications',
    tags: ['LLM', 'Long Context', 'Safety', 'Document AI'],
  },
  {
    id: 'gemini',
    name: 'Gemini 1.5 / 2.0',
    vendor: 'Google',
    category: 'Foundation Model',
    description: 'Multimodal foundation model with native audio, image, and video understanding. Tight integration with Google Workspace and Search.',
    website: 'https://deepmind.google/technologies/gemini',
    pricingModel: 'Pay-per-use',
    scores: { capability: 5, integration: 4, dataPrivacy: 3, support: 4, costEfficiency: 4 },
    euDataResidency: 'Partial',
    gdprReady: true,
    onPremise: false,
    apiAccess: true,
    fineTuning: true,
    contextWindowK: 1000,
    bestFor: 'Multimodal tasks, Google Workspace automation, large document processing',
    tags: ['LLM', 'Multimodal', 'Vision', 'Long Context'],
  },
  {
    id: 'azure-openai',
    name: 'Azure OpenAI Service',
    vendor: 'Microsoft',
    category: 'ML Platform',
    description: 'OpenAI models hosted on Azure infrastructure with EU data residency, private endpoints, and enterprise SLAs. Preferred choice for regulated industries.',
    website: 'https://azure.microsoft.com/en-us/products/ai-services/openai-service',
    pricingModel: 'Pay-per-use',
    scores: { capability: 5, integration: 5, dataPrivacy: 5, support: 5, costEfficiency: 3 },
    euDataResidency: true,
    gdprReady: true,
    onPremise: false,
    apiAccess: true,
    fineTuning: true,
    contextWindowK: 128,
    bestFor: 'Enterprise deployments requiring EU data residency and compliance',
    tags: ['LLM', 'Enterprise', 'EU Compliant', 'Private Endpoint'],
  },
  {
    id: 'mistral',
    name: 'Mistral Large / Le Chat',
    vendor: 'Mistral AI',
    category: 'Foundation Model',
    description: 'European-built LLMs with EU data residency by default. Strong multilingual performance, especially in French and German. GDPR-native architecture.',
    website: 'https://mistral.ai',
    pricingModel: 'Pay-per-use',
    scores: { capability: 4, integration: 4, dataPrivacy: 5, support: 3, costEfficiency: 5 },
    euDataResidency: true,
    gdprReady: true,
    onPremise: true,
    apiAccess: true,
    fineTuning: true,
    contextWindowK: 128,
    bestFor: 'EU-compliant deployments, multilingual (FR/DE), cost-efficient inference',
    tags: ['LLM', 'EU-Based', 'Multilingual', 'GDPR-Native'],
  },
  {
    id: 'aws-bedrock',
    name: 'Amazon Bedrock',
    vendor: 'AWS',
    category: 'ML Platform',
    description: 'Managed service giving access to Claude, Llama, Titan, and other models via a single API. EU regions available. Strong SageMaker integration for MLOps.',
    website: 'https://aws.amazon.com/bedrock',
    pricingModel: 'Pay-per-use',
    scores: { capability: 4, integration: 4, dataPrivacy: 4, support: 5, costEfficiency: 4 },
    euDataResidency: true,
    gdprReady: true,
    onPremise: false,
    apiAccess: true,
    fineTuning: true,
    contextWindowK: 200,
    bestFor: 'Teams already on AWS seeking a multi-model gateway with MLOps tooling',
    tags: ['Multi-model', 'MLOps', 'Enterprise', 'EU Region'],
  },
  {
    id: 'vertex-ai',
    name: 'Vertex AI',
    vendor: 'Google Cloud',
    category: 'ML Platform',
    description: 'End-to-end ML platform offering model training, serving, and pipeline orchestration. Includes access to Gemini and PaLM via API with EU region support.',
    website: 'https://cloud.google.com/vertex-ai',
    pricingModel: 'Pay-per-use',
    scores: { capability: 4, integration: 4, dataPrivacy: 4, support: 4, costEfficiency: 3 },
    euDataResidency: true,
    gdprReady: true,
    onPremise: false,
    apiAccess: true,
    fineTuning: true,
    contextWindowK: null,
    bestFor: 'Full ML lifecycle management on GCP; AutoML and custom model training',
    tags: ['MLOps', 'AutoML', 'Enterprise', 'EU Region'],
  },
  {
    id: 'copilot-studio',
    name: 'Copilot Studio',
    vendor: 'Microsoft',
    category: 'AI Automation',
    description: 'No-code/low-code platform for building conversational AI agents on top of GPT-4 and internal data. Native Microsoft 365 integration.',
    website: 'https://www.microsoft.com/en-us/microsoft-copilot/microsoft-copilot-studio',
    pricingModel: 'Subscription',
    scores: { capability: 3, integration: 5, dataPrivacy: 5, support: 5, costEfficiency: 3 },
    euDataResidency: true,
    gdprReady: true,
    onPremise: false,
    apiAccess: true,
    fineTuning: false,
    contextWindowK: null,
    bestFor: 'Non-technical teams building chatbots, SharePoint/Teams/M365 automation',
    tags: ['No-code', 'Chatbot', 'M365', 'EU Compliant'],
  },
  {
    id: 'watsonx',
    name: 'IBM watsonx.ai',
    vendor: 'IBM',
    category: 'ML Platform',
    description: 'Enterprise AI platform with governed model lifecycle management. Includes Granite LLMs, AI governance tools, and on-premise deployment options.',
    website: 'https://www.ibm.com/watsonx',
    pricingModel: 'Enterprise',
    scores: { capability: 3, integration: 3, dataPrivacy: 5, support: 5, costEfficiency: 2 },
    euDataResidency: true,
    gdprReady: true,
    onPremise: true,
    apiAccess: true,
    fineTuning: true,
    contextWindowK: 32,
    bestFor: 'Highly regulated industries (finance, insurance) requiring on-premise AI governance',
    tags: ['Enterprise', 'On-Premise', 'Governance', 'Regulated Industries'],
  },
  {
    id: 'sap-ai-core',
    name: 'SAP AI Core',
    vendor: 'SAP',
    category: 'ML Platform',
    description: 'AI runtime integrated with SAP BTP for deploying ML models within the SAP ecosystem. Includes Joule copilot and pre-built business AI scenarios.',
    website: 'https://www.sap.com/products/artificial-intelligence/ai-core.html',
    pricingModel: 'Enterprise',
    scores: { capability: 3, integration: 5, dataPrivacy: 5, support: 5, costEfficiency: 2 },
    euDataResidency: true,
    gdprReady: true,
    onPremise: false,
    apiAccess: true,
    fineTuning: false,
    contextWindowK: null,
    bestFor: 'SAP-centric organisations wanting AI embedded in ERP/S4HANA workflows',
    tags: ['SAP', 'ERP', 'Enterprise', 'BTP'],
  },
  {
    id: 'llama',
    name: 'Llama 3.x (Meta)',
    vendor: 'Meta (Open Source)',
    category: 'Foundation Model',
    description: 'Open-weight LLM family deployable on your own infrastructure. No data leaves your servers. Strong community and fine-tuning ecosystem (Ollama, HuggingFace).',
    website: 'https://llama.meta.com',
    pricingModel: 'Open Source',
    scores: { capability: 4, integration: 3, dataPrivacy: 5, support: 2, costEfficiency: 5 },
    euDataResidency: true,
    gdprReady: true,
    onPremise: true,
    apiAccess: true,
    fineTuning: true,
    contextWindowK: 128,
    bestFor: 'Privacy-first use cases, sensitive data, teams with MLOps capability',
    tags: ['Open Source', 'On-Premise', 'Privacy-First', 'Self-hosted'],
  },
  {
    id: 'cohere',
    name: 'Command R+',
    vendor: 'Cohere',
    category: 'Foundation Model',
    description: 'Enterprise-focused LLMs optimised for RAG and business applications. EU data residency available. Strong embeddings and reranking for search use cases.',
    website: 'https://cohere.com',
    pricingModel: 'Pay-per-use',
    scores: { capability: 4, integration: 4, dataPrivacy: 4, support: 3, costEfficiency: 4 },
    euDataResidency: 'Partial',
    gdprReady: true,
    onPremise: false,
    apiAccess: true,
    fineTuning: true,
    contextWindowK: 128,
    bestFor: 'RAG applications, semantic search, document retrieval at scale',
    tags: ['RAG', 'Embeddings', 'Search', 'Enterprise'],
  },
]

const CATEGORIES: Category[] = ['Foundation Model', 'ML Platform', 'AI Automation', 'Data & Analytics']
const CRITERIA = [
  { key: 'capability',     label: 'AI Capability' },
  { key: 'integration',   label: 'Ease of Integration' },
  { key: 'dataPrivacy',   label: 'Data Privacy / EU' },
  { key: 'support',       label: 'Enterprise Support' },
  { key: 'costEfficiency', label: 'Cost Efficiency' },
] as const

const CATEGORY_COLOUR: Record<Category, string> = {
  'Foundation Model': 'bg-blue-100 text-blue-700',
  'ML Platform':      'bg-purple-100 text-purple-700',
  'AI Automation':    'bg-emerald-100 text-emerald-700',
  'Data & Analytics': 'bg-amber-100 text-amber-700',
}

const PRICING_COLOUR: Record<Pricing, string> = {
  'Pay-per-use': 'bg-sky-100 text-sky-700',
  'Subscription': 'bg-indigo-100 text-indigo-700',
  'Enterprise':  'bg-slate-100 text-slate-600',
  'Open Source': 'bg-green-100 text-green-700',
}

// ── Score bar ──────────────────────────────────────────────────────────────
function ScoreBar({ value }: { value: number }) {
  const colour =
    value >= 4 ? 'bg-green-500' : value === 3 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colour}`} style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-4">{value}</span>
    </div>
  )
}

function BoolCell({ value }: { value: boolean | 'Partial' }) {
  if (value === true)      return <span className="text-green-600 font-bold text-sm">✓</span>
  if (value === 'Partial') return <span className="text-amber-500 font-bold text-sm">~</span>
  return <span className="text-slate-300 text-sm">—</span>
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function VendorPage() {
  const [tab, setTab]               = useState<'catalog' | 'compare'>('catalog')
  const [categoryFilter, setCat]    = useState<Category | 'All'>('All')
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<Set<string>>(new Set())
  const [detailId, setDetailId]     = useState<string | null>(null)

  const filtered = VENDORS.filter((v) => {
    if (categoryFilter !== 'All' && v.category !== categoryFilter) return false
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) &&
        !v.vendor.toLowerCase().includes(search.toLowerCase()) &&
        !v.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))) return false
    return true
  })

  const compareList = VENDORS.filter((v) => selected.has(v.id))

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) }
      else if (next.size < 4) { next.add(id) }
      return next
    })
  }

  const detail = VENDORS.find((v) => v.id === detailId)

  return (
    <div className="p-6 space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vendor Comparison</h1>
          <p className="text-sm text-slate-500 mt-0.5">Evaluate and compare AI vendors across capability, privacy, and cost.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{selected.size}/4 selected</span>
          <button
            onClick={() => setTab('compare')}
            disabled={selected.size < 2}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Compare ({selected.size})
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm w-fit">
        {(['catalog', 'compare'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors ${
              tab === t ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'catalog' ? `Catalog (${VENDORS.length})` : `Compare (${selected.size})`}
          </button>
        ))}
      </div>

      {/* ── CATALOG TAB ── */}
      {tab === 'catalog' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendors or tags…"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56 bg-white"
            />
            <div className="flex gap-1.5 flex-wrap">
              {(['All', ...CATEGORIES] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c as Category | 'All')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                    categoryFilter === c
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            {selected.size > 0 && (
              <button onClick={() => setSelected(new Set())} className="text-xs text-slate-400 hover:text-red-500 ml-auto">
                Clear selection
              </button>
            )}
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((v) => {
              const isSelected = selected.has(v.id)
              return (
                <div
                  key={v.id}
                  className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
                    isSelected ? 'border-blue-500' : 'border-transparent hover:border-slate-200'
                  }`}
                >
                  {/* Card header */}
                  <div className="p-4 pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{v.name}</p>
                        <p className="text-xs text-slate-400">{v.vendor}</p>
                      </div>
                      <button
                        onClick={() => toggleSelect(v.id)}
                        title={isSelected ? 'Remove from comparison' : selected.size >= 4 ? 'Max 4 vendors' : 'Add to comparison'}
                        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold transition-colors ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : selected.size >= 4
                            ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                            : 'border-slate-300 text-slate-400 hover:border-blue-500 hover:text-blue-500'
                        }`}
                      >
                        {isSelected ? '✓' : '+'}
                      </button>
                    </div>

                    <div className="flex gap-1.5 flex-wrap mb-3">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${CATEGORY_COLOUR[v.category]}`}>
                        {v.category}
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PRICING_COLOUR[v.pricingModel]}`}>
                        {v.pricingModel}
                      </span>
                      {v.euDataResidency === true && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">EU Data ✓</span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{v.description}</p>
                  </div>

                  {/* Scores */}
                  <div className="px-4 py-3 border-t border-slate-50 space-y-1.5">
                    {CRITERIA.map((c) => (
                      <div key={c.key} className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 w-32 flex-shrink-0">{c.label}</span>
                        <ScoreBar value={v.scores[c.key]} />
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex gap-1 flex-wrap">
                      {v.tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => setDetailId(v.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Details →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── COMPARE TAB ── */}
      {tab === 'compare' && (
        <div className="space-y-4">
          {compareList.length < 2 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm">
              <p className="text-slate-500 text-sm">Select at least 2 vendors from the Catalog to compare.</p>
              <button onClick={() => setTab('catalog')} className="mt-3 text-sm text-blue-600 font-semibold hover:text-blue-800">
                Go to Catalog →
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-44">Criterion</th>
                    {compareList.map((v) => (
                      <th key={v.id} className="px-4 py-3 text-center min-w-[160px]">
                        <p className="font-bold text-slate-800 text-sm">{v.name}</p>
                        <p className="text-xs text-slate-400 font-normal">{v.vendor}</p>
                        <span className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${CATEGORY_COLOUR[v.category]}`}>
                          {v.category}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Scores */}
                  <tr className="bg-slate-50">
                    <td colSpan={compareList.length + 1} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Performance Scores (out of 5)
                    </td>
                  </tr>
                  {CRITERIA.map((c, i) => (
                    <tr key={c.key} className={i % 2 === 0 ? '' : 'bg-slate-50/50'}>
                      <td className="px-4 py-3 text-xs text-slate-600 font-medium">{c.label}</td>
                      {compareList.map((v) => (
                        <td key={v.id} className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-base font-bold ${v.scores[c.key] >= 4 ? 'text-green-600' : v.scores[c.key] === 3 ? 'text-amber-500' : 'text-red-500'}`}>
                              {v.scores[c.key]}/5
                            </span>
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${v.scores[c.key] >= 4 ? 'bg-green-500' : v.scores[c.key] === 3 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${(v.scores[c.key] / 5) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Compliance */}
                  <tr className="bg-slate-50">
                    <td colSpan={compareList.length + 1} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Compliance & Deployment
                    </td>
                  </tr>
                  {[
                    { key: 'euDataResidency', label: 'EU Data Residency' },
                    { key: 'gdprReady',       label: 'GDPR Ready' },
                    { key: 'onPremise',       label: 'On-Premise / Self-hosted' },
                    { key: 'apiAccess',       label: 'API Access' },
                    { key: 'fineTuning',      label: 'Fine-Tuning' },
                  ].map(({ key, label }, i) => (
                    <tr key={key} className={i % 2 === 0 ? '' : 'bg-slate-50/50'}>
                      <td className="px-4 py-3 text-xs text-slate-600 font-medium">{label}</td>
                      {compareList.map((v) => (
                        <td key={v.id} className="px-4 py-3 text-center">
                          <BoolCell value={(v as unknown as Record<string, boolean | 'Partial'>)[key]} />
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Details */}
                  <tr className="bg-slate-50">
                    <td colSpan={compareList.length + 1} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Details
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-xs text-slate-600 font-medium">Pricing Model</td>
                    {compareList.map((v) => (
                      <td key={v.id} className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${PRICING_COLOUR[v.pricingModel]}`}>
                          {v.pricingModel}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="px-4 py-3 text-xs text-slate-600 font-medium">Context Window</td>
                    {compareList.map((v) => (
                      <td key={v.id} className="px-4 py-3 text-center text-xs text-slate-700 font-semibold">
                        {v.contextWindowK ? `${v.contextWindowK}k tokens` : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-xs text-slate-600 font-medium align-top">Best For</td>
                    {compareList.map((v) => (
                      <td key={v.id} className="px-4 py-3 text-center text-xs text-slate-500 leading-relaxed">
                        {v.bestFor}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── DETAIL DRAWER ── */}
      {detail && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDetailId(null)} />
          <div className="w-[420px] bg-white shadow-2xl overflow-y-auto flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <p className="font-bold text-slate-800 text-lg">{detail.name}</p>
                <p className="text-sm text-slate-400">{detail.vendor}</p>
              </div>
              <button onClick={() => setDetailId(null)} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
            </div>

            <div className="p-5 space-y-5 flex-1">
              <div className="flex gap-2 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-1 rounded ${CATEGORY_COLOUR[detail.category]}`}>{detail.category}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${PRICING_COLOUR[detail.pricingModel]}`}>{detail.pricingModel}</span>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">{detail.description}</p>

              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">Performance</p>
                <div className="space-y-2">
                  {CRITERIA.map((c) => (
                    <div key={c.key} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-36 flex-shrink-0">{c.label}</span>
                      <ScoreBar value={detail.scores[c.key]} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">Compliance & Deployment</p>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  {[
                    ['EU Data Residency', detail.euDataResidency],
                    ['GDPR Ready', detail.gdprReady],
                    ['On-Premise', detail.onPremise],
                    ['API Access', detail.apiAccess],
                    ['Fine-Tuning', detail.fineTuning],
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex items-center gap-2">
                      <BoolCell value={val as boolean | 'Partial'} />
                      <span className="text-xs text-slate-600">{label as string}</span>
                    </div>
                  ))}
                  {detail.contextWindowK && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-blue-600">{detail.contextWindowK}k</span>
                      <span className="text-xs text-slate-600">context tokens</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-700 mb-1.5">Best For</p>
                <p className="text-xs text-slate-500 leading-relaxed">{detail.bestFor}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-700 mb-1.5">Tags</p>
                <div className="flex gap-1.5 flex-wrap">
                  {detail.tags.map((t) => (
                    <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => { toggleSelect(detail.id); setDetailId(null) }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  selected.has(detail.id)
                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                    : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-500'
                }`}
              >
                {selected.has(detail.id) ? 'Remove from compare' : 'Add to compare'}
              </button>
              <a
                href={detail.website}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600 hover:border-slate-400 transition-colors"
              >
                Website →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
