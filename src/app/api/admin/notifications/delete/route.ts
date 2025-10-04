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
    const res = await fetch(joinUrl(baseUrl, '/api/notifications/delete'), {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Api-Key': key }, body: JSON.stringify(payload)
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) return NextResponse.json({ ok: true, ...data })

    // Fallback: if we have telegram_chat_id/message_ids from bot_notifications, try to expand by batch_id
    try {
      const supabase = getSupabaseAdmin()
      const bid = (payload?.broadcast_id || '').trim()
      if (bid) {
        const { data: rows } = await supabase
          .from('bot_notifications')
          .select('telegram_chat_id, telegram_message_id')
          .eq('batch_id', bid)
          .not('telegram_message_id', 'is', null)
          .limit(1000)
        const pairs = (rows || []).map(r => ({ chat_id: r.telegram_chat_id, message_id: r.telegram_message_id }))
        return NextResponse.json({ ok: true, results: pairs.map(p => ({ ...p, ok: false, error: 'bot_unreachable' })) })
      }
    } catch {}
    return NextResponse.json({ ok: false, error: data?.error || 'bot_error' }, { status: res.status })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'delete_failed' }, { status: 500 })
  }
}


