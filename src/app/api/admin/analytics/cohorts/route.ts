import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const ok = await requireAdmin(request)
  if (!ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const botBase = process.env.BOT_BACKEND_URL
    const botKey = process.env.BOT_BACKEND_ADMIN_KEY || process.env.BOT_BACKEND_INTERNAL_KEY || process.env.API_INTERNAL_KEY
    if (!botBase || !botKey) return NextResponse.json({ ok: false, error: 'missing_bot_backend_env' }, { status: 500 })

    const url = new URL(`${String(botBase).replace(/\/$/, '')}/api/admin/cohorts`)
    for (const [k, v] of request.nextUrl.searchParams.entries()) url.searchParams.set(k, v)

    const res = await fetch(url.toString(), {
      headers: { 'x-api-key': botKey },
      cache: 'no-store',
    })
    const text = await res.text()
    if (!res.ok) return NextResponse.json({ ok: false, error: `bot_error_${res.status}`, details: text }, { status: 500 })
    return NextResponse.json(JSON.parse(text || '{}'))
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 })
  }
}
