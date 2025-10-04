import { requireAdmin } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/g, '')
  const p = ('/' + (path || '')).replace(/\/+/, '/')
  return b + p
}

export async function POST(request: NextRequest) {
  const ok = await requireAdmin(request)
  if (!ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  try {
    const host = request.headers.get('host') || ''
    const isLocalHost = /localhost|127\.0\.0\.1|\.local(:\d+)?$/i.test(host)
    const useTest = process.env.NODE_ENV !== 'production' || isLocalHost
    const baseUrl = useTest
      ? (process.env.BOT_TEST_SERVER_URL || process.env.BOT_SERVER_URL || 'http://localhost:8002')
      : (process.env.BOT_SERVER_URL || 'http://localhost:8002')
    const key = process.env.API_INTERNAL_KEY || ''
    const payload = await request.json().catch(() => ({}))
    const res = await fetch(joinUrl(baseUrl, '/api/notifications/edit'), {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Api-Key': key }, body: JSON.stringify(payload)
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) return NextResponse.json({ ok: true, ...data })

    // Fallback: find a recent bot_notification by chat/message to confirm existence and return a no-op response indicating bot unreachable
    try {
      const supabase = getSupabaseAdmin()
      const cid = payload?.chat_id
      const mid = payload?.message_id
      if (cid && mid) {
        const { data: rows } = await supabase
          .from('bot_notifications')
          .select('id')
          .eq('telegram_chat_id', cid)
          .eq('telegram_message_id', mid)
          .limit(1)
        if (rows && rows.length > 0) {
          return NextResponse.json({ ok: false, error: 'bot_unreachable' }, { status: 503 })
        }
      }
    } catch {}
    return NextResponse.json({ ok: false, error: data?.error || 'bot_error' }, { status: res.status })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'edit_failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const ok = await requireAdmin(request)
  if (!ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  try {
    const host = request.headers.get('host') || ''
    const isLocalHost = /localhost|127\.0\.0\.1|\.local(:\d+)?$/i.test(host)
    const useTest = process.env.NODE_ENV !== 'production' || isLocalHost
    const baseUrl = useTest
      ? (process.env.BOT_TEST_SERVER_URL || process.env.BOT_SERVER_URL || 'http://localhost:8002')
      : (process.env.BOT_SERVER_URL || 'http://localhost:8002')
    const key = process.env.API_INTERNAL_KEY || ''
    const payload = await request.json().catch(() => ({}))
    const res = await fetch(joinUrl(baseUrl, '/api/notifications/edit_batch'), {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Api-Key': key }, body: JSON.stringify(payload)
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return NextResponse.json({ ok: false, error: data?.error || 'bot_error' }, { status: res.status })
    return NextResponse.json({ ok: true, ...data })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'edit_batch_failed' }, { status: 500 })
  }
}


