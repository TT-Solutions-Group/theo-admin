import { COOKIE_NAME, createSessionToken } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const password = body?.password as string | undefined
    const expected = process.env.ADMIN_DASHBOARD_PASSWORD

    if (!expected) {
      return NextResponse.json({ ok: false, error: 'Server not configured' }, { status: 500 })
    }
    if (!password || password !== expected) {
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await createSessionToken({ sub: 'admin' })
    const res = NextResponse.json({ ok: true })
    const isProd = process.env.NODE_ENV === 'production'
    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'lax' : 'lax',
      path: '/',
      // 7 days for convenience; middleware validates token anyway
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  } catch {
    return NextResponse.json({ ok: false, error: 'Unexpected error' }, { status: 500 })
  }
}
