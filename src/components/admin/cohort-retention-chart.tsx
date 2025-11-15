'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

type CohortRow = {
  cohort_key: string
  cohort_date: string
  cohort_size: number
  users: number[]
  windows: Record<string, number>
  revenue?: Record<string, number>
}

type CohortRetentionChartProps = {
  rows: CohortRow[]
  avgRetention: Record<string, number>
}

// Color palette for cohort lines
const COLORS = [
  '#10b981', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
]

export function CohortRetentionChart({ rows, avgRetention }: CohortRetentionChartProps) {
  if (!rows || rows.length === 0) {
    return (
      <Card className="elevated">
        <CardHeader>
          <CardTitle>Retention Curves</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-[rgb(var(--muted-foreground))]">
            No data available for retention curves.
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get window keys from first row
  const windowKeys = Object.keys(rows[0].windows).sort((a, b) => {
    const numA = parseInt(a.substring(1))
    const numB = parseInt(b.substring(1))
    return numA - numB
  })

  // Transform data for Recharts
  const chartData = windowKeys.map(windowKey => {
    const dataPoint: any = {
      window: windowKey,
      average: (avgRetention[windowKey] || 0) * 100 // Convert to percentage
    }

    // Add each cohort's data (limit to first 8 cohorts for readability)
    rows.slice(0, 8).forEach((row, index) => {
      dataPoint[row.cohort_key] = (row.windows[windowKey] || 0) * 100
    })

    return dataPoint
  })

  return (
    <Card className="elevated">
      <CardHeader>
        <CardTitle>Retention Curves</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis
              dataKey="window"
              stroke="rgba(255, 255, 255, 0.5)"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="rgba(255, 255, 255, 0.5)"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(var(--card))',
                border: '1px solid rgb(var(--border))',
                borderRadius: '8px',
                color: 'rgb(var(--foreground))'
              }}
              formatter={(value: any) => `${value.toFixed(1)}%`}
            />
            <Legend
              wrapperStyle={{
                fontSize: '12px',
                paddingTop: '20px'
              }}
            />

            {/* Average line (bold) */}
            <Line
              type="monotone"
              dataKey="average"
              stroke="#10b981"
              strokeWidth={3}
              name="Average"
              dot={{ r: 4 }}
            />

            {/* Individual cohort lines */}
            {rows.slice(0, 8).map((row, index) => (
              <Line
                key={row.cohort_key}
                type="monotone"
                dataKey={row.cohort_key}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                name={row.cohort_key}
                dot={{ r: 3 }}
                strokeDasharray={index >= 4 ? "5 5" : undefined} // Dashed for cohorts 5-8
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {rows.length > 8 && (
          <div className="mt-4 text-center text-sm text-[rgb(var(--muted-foreground))]">
            Showing first 8 cohorts. Total cohorts: {rows.length}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
