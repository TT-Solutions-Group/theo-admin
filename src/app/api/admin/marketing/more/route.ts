import { NextRequest, NextResponse } from 'next/server'
import { listMarketingEvents } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
	const ok = await requireAdmin(request)
	if (!ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
	
	try {
		const searchParams = request.nextUrl.searchParams
		const offset = parseInt(searchParams.get('offset') || '0')
		const limit = parseInt(searchParams.get('limit') || '100')
		
		const events = await listMarketingEvents({ limit, offset })
		const hasMore = events.length === limit
		
		return NextResponse.json({ ok: true, events, hasMore })
	} catch {
		return NextResponse.json({ ok: false, error: 'Failed to fetch events' }, { status: 500 })
	}
}