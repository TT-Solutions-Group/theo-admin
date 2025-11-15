import { StatCard } from '@/components/ui/stat-card'
import { Users, TrendingUp, Trophy, BarChart3 } from 'lucide-react'

type CohortRow = {
  cohort_key: string
  cohort_date: string
  cohort_size: number
  users: number[]
  windows: Record<string, number>
  revenue?: Record<string, number>
}

type CohortStatsCardsProps = {
  rows: CohortRow[]
  avgRetention: Record<string, number>
  totalUsers: number
  bestCohort: string | null
}

export function CohortStatsCards({ rows, avgRetention, totalUsers, bestCohort }: CohortStatsCardsProps) {
  // Calculate total cohorts
  const totalCohorts = rows.length

  // Calculate average retention across all windows and cohorts
  const allRetentionValues = Object.values(avgRetention)
  const overallAvgRetention = allRetentionValues.length > 0
    ? allRetentionValues.reduce((sum, val) => sum + val, 0) / allRetentionValues.length
    : 0

  // Find best cohort and its average retention
  let bestCohortAvgRetention = 0
  if (bestCohort) {
    const bestCohortRow = rows.find(r => r.cohort_key === bestCohort)
    if (bestCohortRow) {
      const retentionValues = Object.values(bestCohortRow.windows)
      bestCohortAvgRetention = retentionValues.length > 0
        ? retentionValues.reduce((sum, val) => sum + val, 0) / retentionValues.length
        : 0
    }
  }

  // Calculate average cohort size
  const avgCohortSize = totalCohorts > 0
    ? Math.round(totalUsers / totalCohorts)
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Cohorts"
        value={totalCohorts}
        icon={BarChart3}
        color="blue"
      />

      <StatCard
        title="Total Users"
        value={totalUsers.toLocaleString()}
        icon={Users}
        color="purple"
      />

      <StatCard
        title="Avg Retention"
        value={`${Math.round(overallAvgRetention * 100)}%`}
        icon={TrendingUp}
        color={overallAvgRetention >= 0.5 ? 'green' : overallAvgRetention >= 0.3 ? 'yellow' : 'red'}
      />

      <StatCard
        title="Best Cohort"
        value={bestCohort ? `${bestCohort} (${Math.round(bestCohortAvgRetention * 100)}%)` : 'N/A'}
        icon={Trophy}
        color="cyan"
      />
    </div>
  )
}
