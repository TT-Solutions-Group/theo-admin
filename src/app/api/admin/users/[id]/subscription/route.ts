import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const ok = await requireAdmin(request)
	if (!ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
	const { id: idStr } = await context.params
	const id = Number(idStr)
	if (!Number.isFinite(id)) return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 })
	const supabase = getSupabaseAdmin()
	try {
		const now = new Date().toISOString()
		const { error } = await supabase
			.from('user_subscriptions')
			.update({ status: 'cancelled', cancelled_at: now })
			.eq('user_id', id)
		if (error) throw error
		return NextResponse.json({ ok: true })
	} catch {
		return NextResponse.json({ ok: false, error: 'Failed to cancel subscription' }, { status: 500 })
	}
}
