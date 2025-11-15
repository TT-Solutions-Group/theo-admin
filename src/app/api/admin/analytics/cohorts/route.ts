import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import {
  calculateCohortRetention,
  type CohortBucket,
  type CohortAnchor,
  type ActiveDefinition
} from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const ok = await requireAdmin(request)
  if (!ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = request.nextUrl

    // Parse query parameters (new spec from cohort.md)
    const anchor = (searchParams.get('anchor') || 'activation') as CohortAnchor
    const activeDefinition = (searchParams.get('active_def') || 'entries_or_miniapp') as ActiveDefinition
    const bucket = (searchParams.get('bucket') || 'weekly') as CohortBucket
    const windows = parseInt(searchParams.get('windows') || '12', 10)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const timezone = searchParams.get('timezone') || 'Asia/Tashkent'

    // Validate parameters
    const validAnchors: CohortAnchor[] = ['acquisition', 'activation', 'billing', 'trial']
    const validActiveDefinitions: ActiveDefinition[] = ['entries_only', 'miniapp_only', 'entries_or_miniapp', 'entries_and_miniapp']
    const validBuckets: CohortBucket[] = ['daily', 'weekly', 'monthly']

    if (!validAnchors.includes(anchor)) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid anchor. Must be one of: acquisition, activation, billing, trial'
      }, { status: 400 })
    }

    if (!validActiveDefinitions.includes(activeDefinition)) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid active_def. Must be one of: entries_only, miniapp_only, entries_or_miniapp, entries_and_miniapp'
      }, { status: 400 })
    }

    if (!validBuckets.includes(bucket)) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid bucket. Must be one of: daily, weekly, monthly'
      }, { status: 400 })
    }

    // Calculate cohort retention
    const cohortData = await calculateCohortRetention({
      anchor,
      activeDefinition,
      bucket,
      windows,
      limit,
      startDate,
      endDate,
      timezone
    })

    // Transform data for response (convert Date objects to strings for JSON)
    const response = {
      ok: true,
      data: {
        rows: cohortData.rows.map(row => ({
          ...row,
          cohort_date: row.cohort_date.toISOString(),
          // Keep retention as 0-1 scale, client will convert to percentage
          windows: row.windows,
          absolute: row.absolute
        })),
        totalUsers: cohortData.totalUsers,
        avgRetention: cohortData.avgRetention,
        bestCohort: cohortData.bestCohort,
        params: {
          anchor,
          active_def: activeDefinition,
          bucket,
          windows,
          limit,
          startDate,
          endDate,
          timezone
        }
      }
    }

    return NextResponse.json(response)
  } catch (e: any) {
    console.error('Cohort analytics error:', e)
    return NextResponse.json({
      ok: false,
      error: e?.message || 'Failed to calculate cohort analytics'
    }, { status: 500 })
  }
}
