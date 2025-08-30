import { NextRequest, NextResponse } from 'next/server'
import { getUserById, updateUserById } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const ok = await requireAdmin(request)
	if (!ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
	const { id: idStr } = await context.params
	const id = Number(idStr)
	if (!Number.isFinite(id)) return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 })
	try {
		const user = await getUserById(id)
		return NextResponse.json({ ok: true, user })
	} catch {
		return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
	}
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const ok = await requireAdmin(request)
	if (!ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
	const { id: idStr } = await context.params
	const id = Number(idStr)
	if (!Number.isFinite(id)) return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 })
	const updates = await request.json().catch(() => null)
	if (!updates || typeof updates !== 'object') return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 })
	try {
		const user = await updateUserById(id, updates)
		return NextResponse.json({ ok: true, user })
	} catch {
		return NextResponse.json({ ok: false, error: 'Failed to update' }, { status: 500 })
	}
}
