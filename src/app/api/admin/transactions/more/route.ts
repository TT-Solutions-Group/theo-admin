import { NextRequest, NextResponse } from 'next/server'
import { listTransactions } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
	const ok = await requireAdmin(request)
	if (!ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
	
	try {
		const searchParams = request.nextUrl.searchParams
		const offset = parseInt(searchParams.get('offset') || '0')
		const limit = parseInt(searchParams.get('limit') || '100')
		
		const transactions = await listTransactions({ limit, offset })
		const hasMore = transactions.length === limit
		
		return NextResponse.json({ ok: true, transactions, hasMore })
	} catch {
		return NextResponse.json({ ok: false, error: 'Failed to fetch transactions' }, { status: 500 })
	}
}