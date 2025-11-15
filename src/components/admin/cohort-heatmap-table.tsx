'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type CohortRow = {
  cohort_key: string
  cohort_date: string
  cohort_size: number
  users: number[]
  windows: Record<string, number> // Retention rates (0-1 scale)
  absolute: Record<string, number> // Absolute user counts
  revenue?: Record<string, number>
}

type CohortHeatmapTableProps = {
  rows: CohortRow[]
}

/**
 * Get color based on retention rate (0-1 scale)
 * Green for high retention, yellow for medium, red for low
 */
function getRetentionColor(rate: number): string {
  if (rate >= 0.7) return 'bg-green-500/20 text-green-400' // High retention
  if (rate >= 0.4) return 'bg-yellow-500/20 text-yellow-400' // Medium retention
  if (rate >= 0.15) return 'bg-orange-500/20 text-orange-400' // Low retention
  if (rate > 0) return 'bg-red-500/20 text-red-400' // Very low retention
  return 'bg-[rgb(var(--card-elevated))] text-[rgb(var(--muted-foreground))]' // No data
}

/**
 * Format retention percentage for display
 */
function formatRetention(rate: number): string {
  return `${Math.round(rate * 100)}%`
}

export function CohortHeatmapTable({ rows }: CohortHeatmapTableProps) {
  const [showAbsolute, setShowAbsolute] = useState(false)

  if (!rows || rows.length === 0) {
    return (
      <Card className="elevated">
        <CardHeader>
          <CardTitle>Cohort Retention Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-[rgb(var(--muted-foreground))]">
            No cohort data available. Try adjusting your filters.
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get window keys from first row (assuming all rows have same windows)
  const windowKeys = Object.keys(rows[0].windows).sort((a, b) => {
    const numA = parseInt(a.substring(1))
    const numB = parseInt(b.substring(1))
    return numA - numB
  })

  return (
    <Card className="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cohort Retention Heatmap</CardTitle>
            <p className="text-sm text-[rgb(var(--muted-foreground))] mt-1">
              {showAbsolute ? 'Showing absolute user counts' : 'Showing retention percentages'}
            </p>
          </div>
          <button
            onClick={() => setShowAbsolute(!showAbsolute)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-[rgb(var(--card-elevated))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--card-elevated))]/80"
          >
            {showAbsolute ? 'Show %' : 'Show Numbers'}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="whoop-table w-full">
            <thead>
              <tr>
                <th className="sticky left-0 bg-[rgb(var(--background))] z-10">Cohort</th>
                <th className="text-right">Size</th>
                {windowKeys.map(key => (
                  <th key={key} className="text-center">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.cohort_key}>
                  <td className="sticky left-0 bg-[rgb(var(--background))] z-10 font-medium">
                    {row.cohort_key}
                  </td>
                  <td className="text-right text-[rgb(var(--muted-foreground))]">
                    {row.cohort_size.toLocaleString()}
                  </td>
                  {windowKeys.map(key => {
                    const rate = row.windows[key] || 0
                    const absolute = row.absolute?.[key] || 0

                    return (
                      <td key={key} className="text-center p-1">
                        <div
                          className={`px-2 py-1 rounded text-sm font-medium cursor-help ${getRetentionColor(rate)}`}
                          title={`${absolute} out of ${row.cohort_size} users (${formatRetention(rate)})`}
                        >
                          {showAbsolute ? absolute.toLocaleString() : formatRetention(rate)}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 rounded bg-green-500/20"></div>
            <span className="text-[rgb(var(--muted-foreground))]">High (70%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 rounded bg-yellow-500/20"></div>
            <span className="text-[rgb(var(--muted-foreground))]">Medium (40-70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 rounded bg-orange-500/20"></div>
            <span className="text-[rgb(var(--muted-foreground))]">Low (15-40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 rounded bg-red-500/20"></div>
            <span className="text-[rgb(var(--muted-foreground))]">Very Low (&lt;15%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
