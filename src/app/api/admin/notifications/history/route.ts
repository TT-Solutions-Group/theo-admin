import { requireAdmin } from '@/lib/auth'
import { getSupabaseAdmin, listBotNotifications } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/g, '')
  const p = ('/' + (path || '')).replace(/\/+/, '/')
  return b + p
}

export async function GET(request: NextRequest) {
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

    const urlObj = new URL(request.url)
    const query = urlObj.searchParams.toString()
    const botUrl = joinUrl(baseUrl, '/api/notifications/history') + (query ? `?${query}` : '')
    // First, try bot server history if available
    const isGrouped = urlObj.searchParams.has('group')
    try {
      const res = await fetch(botUrl, { method: 'GET', headers: { 'X-Api-Key': key } })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        const items = Array.isArray((data as any)?.items) ? (data as any).items : []
        return NextResponse.json({ ok: true, items })
      }
      // Fall through to Supabase fallback below
    } catch {
      // Fall through to Supabase fallback below
    }

    // Fallback: use Supabase bot_notifications as history source
    const limit = Math.max(1, Math.min(200, Number(urlObj.searchParams.get('limit') || '50')))
    const offset = Math.max(0, Number(urlObj.searchParams.get('offset') || '0'))
    if (isGrouped) {
      // Group by broadcast_id using Supabase fallback from sent_notifications
      try {
        const supabase = getSupabaseAdmin()
        const { data, error } = await supabase
          .from('sent_notifications')
          .select('broadcast_id, sent_at, caption, html')
          .not('broadcast_id', 'is', null)
        if (error) throw error
        const all = (data || []) as Array<{ broadcast_id: string | null; sent_at: string | null; caption?: string | null; html?: string | null }>
        // Aggregate in memory
        const agg: Record<string, { first: string; last: string; count: number; preview: string }> = {}
        for (const r of all) {
          const bid = r.broadcast_id as string
          if (!bid) continue
          const ts = (r.sent_at || '')
          const when = ts || new Date(0).toISOString()
          const previewCandidate = (r.caption && r.caption.trim()) || (r.html && r.html.trim()) || ''
          const cur = agg[bid] || { first: when, last: when, count: 0, preview: '' }
          if (when < cur.first) cur.first = when
          if (when > cur.last) cur.last = when
          cur.count += 1
          if (!cur.preview && previewCandidate) cur.preview = previewCandidate
          agg[bid] = cur
        }
        const items = Object.entries(agg)
          .map(([bid, v]) => ({ broadcast_id: bid, first_sent_at: v.first, last_sent_at: v.last, message_count: v.count, preview_text: v.preview }))
          .sort((a, b) => (a.last_sent_at < b.last_sent_at ? 1 : -1))
          .slice(offset, offset + limit)
        return NextResponse.json({ ok: true, items })
      } catch {
        return NextResponse.json({ ok: true, items: [] })
      }
    } else {
      const rows = await listBotNotifications({ limit, offset }).catch(() => [])
      // Map to the history item shape used by UI
      const items = (rows || []).map((r: any) => ({
        id: r.id,
        telegram_id: r.telegram_chat_id,
        message_id: r.telegram_message_id,
        sent_at: r.sent_at || r.created_at,
        broadcast_id: r.batch_id || null,
        media_type: null,
        html: null,
        caption: null,
        buttons: null,
        protect_content: null,
        disable_web_page_preview: null,
        deleted_at: null,
      }))
      return NextResponse.json({ ok: true, items })
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'history_failed' }, { status: 500 })
  }
}


