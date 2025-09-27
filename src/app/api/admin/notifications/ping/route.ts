import { requireAdmin } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

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
    const url = `${baseUrl}/api/health`
    let status = 0
    let body: any = null
    try {
      const res = await fetch(url, { method: 'GET' })
      status = res.status
      body = await res.json().catch(() => ({}))
    } catch (e: any) {
      return NextResponse.json({ ok: false, baseUrl, error: String(e) }, { status: 502 })
    }
    return NextResponse.json({ ok: true, baseUrl, status, body })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'ping_failed' }, { status: 400 })
  }
}


