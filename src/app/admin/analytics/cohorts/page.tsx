import { Suspense } from 'react'

async function fetchCohorts(params: URLSearchParams) {
  const qs = params.toString()
  const res = await fetch(`/api/admin/analytics/cohorts${qs ? `?${qs}` : ''}`, { cache: 'no-store' })
  if (!res.ok) return { ok: false, rows: [] as any[] }
  return res.json()
}

export default async function CohortsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const p = await searchParams
  const params = new URLSearchParams()
  params.set('anchor', p.anchor || 'activation')
  params.set('bucket', p.bucket || 'weekly')
  params.set('active_def', p.active_def || 'entries_only_v1')
  params.set('limit', p.limit || '12')

  const data = await fetchCohorts(params)
  const rows: Array<{ cohort_key: string; cohort_size: number; windows: Record<string, number> }> = data?.rows || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cohorts</h1>
        <p className="text-sm text-muted-foreground">Activation · Weekly · {data?.active_def}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2">Cohort</th>
              <th className="text-left p-2">Size</th>
              {Array.from({ length: 12 }).map((_, i) => (
                <th key={i} className="text-left p-2">W{i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.cohort_key} className="border-t">
                <td className="p-2">{r.cohort_key}</td>
                <td className="p-2">{r.cohort_size}</td>
                {Array.from({ length: 12 }).map((_, i) => {
                  const key = `W${i + 1}`
                  const v = r.windows?.[key]
                  const pct = typeof v === 'number' ? Math.round(v * 100) : null
                  return (
                    <td key={key} className="p-2">
                      {pct !== null ? `${pct}%` : '—'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


