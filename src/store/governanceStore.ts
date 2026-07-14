import { create } from 'zustand'
import { GovernanceData } from '../types'
import { loadGovernance, saveGovernance } from '../lib/supabase'
import { getDemoMode } from './demoStore'

export const DEMO_GOVERNANCE: GovernanceData = {
  richtlinie: {
    zweck: 'AI is used exclusively to support business processes that create measurable value for customers, employees, or partners. Permitted areas include customer service automation, supply chain optimisation, fraud prevention, HR analytics, and product recommendation. AI must not make fully autonomous decisions affecting individuals without human oversight.',
    daten: 'Only company-owned, licensed, or user-consented data may be used for AI training or inference. Personal data is processed under GDPR legal bases (Art. 6 and Art. 9 where applicable). All data used in production AI systems is inventoried in the data catalogue. Sensitive categories (health, financial, HR) require explicit DPO sign-off before use.',
    transparenz: 'All AI systems deployed in customer-facing or HR contexts must include an explanation layer accessible to affected parties. Employees are notified when AI contributes to decisions affecting them. Decision logs are retained for 24 months for audit purposes. The AI Register documents all live systems with their data sources and model versions.',
    verantwortlichkeiten: 'The AI Owner (CDO) bears overall responsibility for the AI programme. Each use case has a named Business Sponsor and a Technical Owner. The DPO is consulted on all use cases involving personal data. The Ethics Reviewer conducts fairness reviews before go-live for HR and customer-facing systems. The AI Governance Committee meets quarterly to review compliance status.',
    risikomanagement: 'All use cases are classified under the EU AI Act risk pyramid. High-risk systems (EU AI Act Annex III) require a full conformity assessment and DPIA before deployment. An AI Risk Register documents likelihood, impact, mitigation, and residual risk for all systems. Critical risks (score ≥15) are escalated to the AI Governance Committee within 5 business days.',
    ethik: 'AI systems must not discriminate on the basis of age, gender, ethnicity, religion, disability, or other protected characteristics. All customer-facing and HR AI systems are tested for demographic bias before go-live and on a 6-month cadence thereafter. The Ethics Reviewer maintains a bias test log. Employees may raise ethical concerns anonymously via the AI Ethics Hotline.',
    schulung: 'All employees who interact with AI systems complete a mandatory 2-hour AI Fundamentals course within 30 days of onboarding. Role-specific training (developers, analysts, managers) is completed within 90 days. AI Champions in each department receive 8 hours of advanced training annually. Completion is tracked in the Enablement Matrix and reported to the AI Governance Committee.',
  },
  roles: {
    aiOwner:  'Dr. Maria Müller (Chief Digital Officer)',
    dpo:      'Thomas Fischer (Data Protection Officer)',
    security: 'Lisa Weber (Head of IT Security)',
    ethics:   'James Okafor (AI Ethics Committee Chair)',
    business: 'Sandra Klein (VP Operations)',
  },
  steps: {
    step1: true, step2: true, step3: true, step4: true, step5: true,
    step6: false, step7: true, step8: false, step9: false,
  },
  aims: {
    kl4:  { status: 'done',        note: 'Scope defined: 4 AI systems in operation (Radiologie-KI, EPA-Agent, Chatbot, Verbrauchsmaterialien). Stakeholder map documented.' },
    kl5:  { status: 'done',        note: 'KI-Politik signed off by GF. KI-Beauftragter role established per Klausel 5.3.' },
    kl6:  { status: 'in_progress', note: 'Risk assessment completed for Hochrisiko-Systeme. Impact Assessment (A.5) for Radiologie-KI pending.' },
    kl7:  { status: 'in_progress', note: 'Training matrix active (see Enablement). 68% completion — ISO 42001 §7.2 requires 100% for go-live roles.' },
    kl8:  { status: 'in_progress', note: 'KI-Lebenszyklus documented for Radiologie-KI and EPA-Agent. Validierungsdokumentation for Chatbot pending.' },
    kl9:  { status: 'not_started', note: '' },
    kl10: { status: 'not_started', note: '' },
  },
}

interface GovernanceStore {
  data: GovernanceData | null
  loading: boolean
  saving: boolean
  init: () => Promise<void>
  save: (data: GovernanceData) => Promise<void>
}

export const useGovernanceStore = create<GovernanceStore>()((set) => ({
  data: null,
  loading: true,
  saving: false,

  init: async () => {
    if (getDemoMode()) {
      set({ data: DEMO_GOVERNANCE, loading: false })
      return
    }
    const data = await loadGovernance()
    set({ data, loading: false })
  },

  save: async (data) => {
    set({ saving: true })
    if (!getDemoMode()) await saveGovernance(data)
    set({ data, saving: false })
  },
}))
