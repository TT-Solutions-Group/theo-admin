import { requireAdmin } from '@/lib/auth'
import { resolveFiltersToUserIds, type SegmentFilter } from '@/lib/segments'
import { NextRequest, NextResponse } from 'next/server'

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/g, '')
  const p = ('/' + (path || '')).replace(/\/+/, '/')
  return b + p
}

async function postBot(path: string, body: any, baseUrl?: string) {
  const url = joinUrl(baseUrl || process.env.BOT_SERVER_URL || 'http://localhost:8002', path)
  const key = process.env.API_INTERNAL_KEY
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': key || '',
    },
    body: JSON.stringify(body || {}),
  })
  return res
}

export async function POST(request: NextRequest) {
  const ok = await requireAdmin(request)
  if (!ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  try {
    const contentType = request.headers.get('content-type') || ''
    const host = request.headers.get('host') || ''
    const isLocalHost = /localhost|127\.0\.0\.1|\.local(:\d+)?$/i.test(host)
    const useTest = process.env.NODE_ENV !== 'production' || isLocalHost
    const baseUrl = useTest
      ? (process.env.BOT_TEST_SERVER_URL || process.env.BOT_SERVER_URL || 'http://localhost:8002')
      : (process.env.BOT_SERVER_URL || 'http://localhost:8002')
    const key = process.env.API_INTERNAL_KEY || ''
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const filtersRaw = form.get('filters')
      let user_ids: number[] | undefined
      if (typeof filtersRaw === 'string' && filtersRaw.trim()) {
        try {
          const filters = JSON.parse(filtersRaw) as SegmentFilter[]
          user_ids = await resolveFiltersToUserIds(filters)
        } catch {}
      }
      const botUrl = joinUrl(baseUrl, '/api/notifications/broadcast')
      // Forward original form-data directly to the bot; don't rebuild
      if (user_ids && user_ids.length > 0) form.set('user_ids', JSON.stringify(user_ids))
      const res = await fetch(botUrl, { method: 'POST', headers: { 'X-Api-Key': key }, body: form as any })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: data?.error || 'bot_error' }, { status: res.status })
      }
      return NextResponse.json({ ok: true, ...data })
    } else {
      const payload = await request.json()
      const filters = Array.isArray(payload?.filters) ? (payload.filters as SegmentFilter[]) : []
      let user_ids: number[] | undefined
      if (filters.length > 0) {
        user_ids = await resolveFiltersToUserIds(filters)
      }
      const body = { ...payload, ...(user_ids && user_ids.length > 0 ? { user_ids } : {}) }
      const res = await postBot('/api/notifications/broadcast', body, baseUrl)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: data?.error || 'bot_error' }, { status: res.status })
      }
      return NextResponse.json({ ok: true, ...data })
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 })
  }
}


