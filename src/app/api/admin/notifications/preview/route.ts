import { requireAdmin } from '@/lib/auth'
import { previewSegment, type SegmentFilter } from '@/lib/segments'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const ok = await requireAdmin(request)
  if (!ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  try {
    const payload = await request.json().catch(() => ({}))
    const filters = Array.isArray(payload?.filters) ? (payload.filters as SegmentFilter[]) : []
    const { count, sample } = await previewSegment(filters, 20)
    return NextResponse.json({ ok: true, count, sample })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 })
  }
}


