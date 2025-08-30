import { NextRequest, NextResponse } from 'next/server'
import { listUsers } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
	const ok = await requireAdmin(request)
	if (!ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
	const { searchParams } = new URL(request.url)
	const q = searchParams.get('q') || undefined
	const limit = Number(searchParams.get('limit') || '50')
	const offset = Number(searchParams.get('offset') || '0')
	try {
		const users = await listUsers({ q, limit, offset })
		return NextResponse.json({ ok: true, users })
	} catch (e) {
		return NextResponse.json({ ok: false, error: 'Failed to list users' }, { status: 500 })
	}
}
