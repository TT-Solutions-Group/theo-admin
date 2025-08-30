import { NextRequest, NextResponse } from 'next/server'
import { fetchStats } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
	const ok = await requireAdmin(request)
	if (!ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
	try {
		const stats = await fetchStats()
		return NextResponse.json({ ok: true, stats })
	} catch {
		return NextResponse.json({ ok: false, error: 'Failed to fetch stats' }, { status: 500 })
	}
}
