import { headers } from 'next/headers'
import { CohortControls } from '@/components/admin/cohort-controls'
import { CohortStatsCards } from '@/components/admin/cohort-stats-cards'
import { CohortHeatmapTable } from '@/components/admin/cohort-heatmap-table'

async function resolveBaseUrl(): Promise<string> {
  const envBase = process.env.NEXT_PUBLIC_APP_BASE_URL
  if (envBase) return String(envBase).replace(/\/$/, '')
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  return `${proto}://${host}`
}

async function fetchCohorts(params: URLSearchParams) {
  const qs = params.toString()
  const base = await resolveBaseUrl()
  const h = await headers()
  const cookie = h.get('cookie') || ''
  const res = await fetch(`${base}/api/admin/analytics/cohorts${qs ? `?${qs}` : ''}`, {
    cache: 'no-store',
    headers: { cookie },
  })
  if (!res.ok) {
    console.error('Failed to fetch cohorts:', res.status, await res.text())
    return { ok: false, data: { rows: [], totalUsers: 0, avgRetention: {}, bestCohort: null } }
  }
  return res.json()
}

export default async function CohortsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const p = await searchParams || {}
  const params = new URLSearchParams()

  // New parameters for cohort analytics (from cohort.md spec)
  params.set('anchor', String(p.anchor || 'activation'))
  params.set('active_def', String(p.active_def || 'entries_or_miniapp'))
  params.set('bucket', String(p.bucket || 'weekly'))
  params.set('windows', String(p.windows || '12'))
  params.set('limit', String(p.limit || '12'))

  const response = await fetchCohorts(params)
  const data = response?.data || { rows: [], totalUsers: 0, avgRetention: {}, bestCohort: null }

  // Get readable labels for display
  const anchorLabels: Record<string, string> = {
    acquisition: 'Acquisition (Registration)',
    activation: 'Activation (First Entry)',
    billing: 'Billing (First Payment)',
    trial: 'Trial Start'
  }

  const activeDefLabels: Record<string, string> = {
    entries_only: 'Entries Only',
    miniapp_only: 'MiniApp Only',
    entries_or_miniapp: 'Entries OR MiniApp',
    entries_and_miniapp: 'Entries AND MiniApp'
  }

  const bucketLabels: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly'
  }

  const currentAnchor = String(p.anchor || 'activation')
  const currentActiveDef = String(p.active_def || 'entries_or_miniapp')
  const currentBucket = String(p.bucket || 'weekly')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">Cohort Analytics</h1>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          {anchorLabels[currentAnchor]} · {bucketLabels[currentBucket]} · {activeDefLabels[currentActiveDef]}
        </p>
      </div>

      {/* Stats Cards */}
      <CohortStatsCards
        rows={data.rows}
        avgRetention={data.avgRetention}
        totalUsers={data.totalUsers}
        bestCohort={data.bestCohort}
      />

      {/* Controls */}
      <CohortControls />

      {/* Heatmap Table */}
      <CohortHeatmapTable
        rows={data.rows}
      />
    </div>
  )
}
