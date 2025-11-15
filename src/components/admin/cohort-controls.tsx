'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'

type CohortAnchor = 'acquisition' | 'activation' | 'billing' | 'trial'
type ActiveDefinition = 'entries_only' | 'miniapp_only' | 'entries_or_miniapp' | 'entries_and_miniapp'
type CohortBucket = 'daily' | 'weekly' | 'monthly'

const ANCHORS: { value: CohortAnchor; label: string; description: string }[] = [
  { value: 'acquisition', label: 'Acquisition', description: 'User registration (onboarding)' },
  { value: 'activation', label: 'Activation', description: 'First transaction/entry' },
  { value: 'billing', label: 'Billing', description: 'First payment' },
  { value: 'trial', label: 'Trial', description: 'Trial/subscription start' },
]

const ACTIVE_DEFINITIONS: { value: ActiveDefinition; label: string; description: string }[] = [
  { value: 'entries_only', label: 'Entries Only', description: 'User made transactions' },
  { value: 'miniapp_only', label: 'MiniApp Only', description: 'User opened mini app' },
  { value: 'entries_or_miniapp', label: 'Entries OR MiniApp', description: 'Transactions or app opens' },
  { value: 'entries_and_miniapp', label: 'Entries AND MiniApp', description: 'Both required' },
]

const BUCKETS: { value: CohortBucket; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

export function CohortControls() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentAnchor = (searchParams.get('anchor') || 'activation') as CohortAnchor
  const currentActiveDef = (searchParams.get('active_def') || 'entries_or_miniapp') as ActiveDefinition
  const currentBucket = (searchParams.get('bucket') || 'weekly') as CohortBucket

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Card className="elevated">
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Cohort Anchor */}
          <div>
            <label className="text-sm font-medium text-[rgb(var(--muted-foreground))] mb-2 block">
              Cohort Anchor (Starting Point)
            </label>
            <div className="flex flex-wrap gap-2">
              {ANCHORS.map(({ value, label, description }) => (
                <button
                  key={value}
                  onClick={() => updateParam('anchor', value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentAnchor === value
                      ? 'bg-[rgb(var(--whoop-green))] text-white'
                      : 'bg-[rgb(var(--card-elevated))] text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--card-elevated))]/80'
                  }`}
                  title={description}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Definition */}
          <div>
            <label className="text-sm font-medium text-[rgb(var(--muted-foreground))] mb-2 block">
              Active Definition (What Counts as Active)
            </label>
            <div className="flex flex-wrap gap-2">
              {ACTIVE_DEFINITIONS.map(({ value, label, description }) => (
                <button
                  key={value}
                  onClick={() => updateParam('active_def', value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentActiveDef === value
                      ? 'bg-[rgb(var(--whoop-green))] text-white'
                      : 'bg-[rgb(var(--card-elevated))] text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--card-elevated))]/80'
                  }`}
                  title={description}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Bucket */}
          <div>
            <label className="text-sm font-medium text-[rgb(var(--muted-foreground))] mb-2 block">
              Time Period
            </label>
            <div className="flex flex-wrap gap-2">
              {BUCKETS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateParam('bucket', value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentBucket === value
                      ? 'bg-[rgb(var(--whoop-green))] text-white'
                      : 'bg-[rgb(var(--card-elevated))] text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--card-elevated))]/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
