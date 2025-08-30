import { NextRequest, NextResponse } from 'next/server'
import { listPayments } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
	const ok = await requireAdmin(request)
	if (!ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
	const { searchParams } = new URL(request.url)
	const limit = Number(searchParams.get('limit') || '50')
	const offset = Number(searchParams.get('offset') || '0')
	try {
		const payments = await listPayments({ limit, offset })
		return NextResponse.json({ ok: true, payments })
	} catch {
		return NextResponse.json({ ok: false, error: 'Failed to list payments' }, { status: 500 })
	}
}
