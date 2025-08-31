import { NextRequest, NextResponse } from 'next/server'
import { listUsers } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
	const ok = await requireAdmin(request)
	if (!ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
	
	try {
		const searchParams = request.nextUrl.searchParams
		const q = searchParams.get('q') || ''
		const offset = parseInt(searchParams.get('offset') || '0')
		const limit = parseInt(searchParams.get('limit') || '50')
		
		const users = await listUsers({ q, limit, offset })
		const hasMore = users.length === limit
		
		return NextResponse.json({ ok: true, users, hasMore })
	} catch {
		return NextResponse.json({ ok: false, error: 'Failed to fetch users' }, { status: 500 })
	}
}