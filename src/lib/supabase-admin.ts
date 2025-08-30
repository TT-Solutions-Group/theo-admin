import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cachedAdminClient: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
	if (cachedAdminClient) return cachedAdminClient

	const url = process.env.SUPABASE_URL
	const key = process.env.SECRET_KEY || process.env.SUPABASE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY

	console.log('Supabase connection:', { 
		url, 
		keyPresent: !!key,
		keyPrefix: key?.substring(0, 20) + '...' 
	})

	if (!url || !key) {
		throw new Error('Missing SUPABASE_URL or SECRET_KEY')
	}

	cachedAdminClient = createClient(url, key, {
		auth: { persistSession: false },
	})
	return cachedAdminClient
}

export type AdminUser = {
	id: number
	telegram_id: number
	username: string | null
	first_name: string | null
	last_name: string | null
	language: string | null
	default_currency: string | null
	is_premium: boolean | null
	terms_accepted: boolean | null
	terms_accepted_at?: string | null
	created_at?: string | null
}

export async function fetchStats() {
	const supabase = getSupabaseAdmin()

	const [usersRes, txRes, activeSubsRes] = await Promise.all([
		supabase.from('users').select('id', { count: 'exact', head: true }),
		supabase.from('transactions').select('id', { count: 'exact', head: true }),
		supabase.from('user_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
	])

	// Calculate total revenue from active subscriptions
	let totalRevenue = 0
	try {
		const { data: subscriptions } = await supabase
			.from('user_subscriptions')
			.select('amount, currency')
			.eq('status', 'active')
		
		if (subscriptions) {
			totalRevenue = subscriptions.reduce((sum, sub) => {
				// All subscriptions should be in UZS, but just in case
				return sum + (sub.amount || 0)
			}, 0)
		}
	} catch (e) {
		console.error('Error calculating revenue:', e)
	}

	return {
		users: usersRes.count ?? 0,
		transactions: txRes.count ?? 0,
		activeSubscriptions: activeSubsRes.count ?? 0,
		totalRevenue, // This is now in UZS from subscriptions
	}
}

export async function listUsers(params: { q?: string; limit?: number; offset?: number }) {
	const supabase = getSupabaseAdmin()
	const { q, limit = 25, offset = 0 } = params

	let query = supabase
		.from('users')
		.select('id, telegram_id, username, first_name, last_name, language, default_currency, is_premium, terms_accepted_at, created_at')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1)

	if (q && q.trim().length > 0) {
		query = query.or(`username.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
	}

	const { data, error } = await query
	console.log('Users query result:', { data, error })
	if (error) throw error
	return (data || []).map((u: any) => ({
		...u,
		terms_accepted: Boolean(u.terms_accepted_at),
	})) as AdminUser[]
}

export async function getUserById(id: number) {
	const supabase = getSupabaseAdmin()
	const { data, error } = await supabase
		.from('users')
		.select('id, telegram_id, username, first_name, last_name, language, default_currency, is_premium, terms_accepted_at, created_at')
		.eq('id', id)
		.single()
	if (error) throw error
	return ({
		...data,
		terms_accepted: Boolean((data as any).terms_accepted_at),
	}) as AdminUser
}

export async function updateUserById(id: number, updates: Partial<AdminUser>) {
	const supabase = getSupabaseAdmin()
	const { data, error } = await supabase
		.from('users')
		.update(updates)
		.eq('id', id)
		.select()
		.single()
	if (error) throw error
	return data as AdminUser
}

export async function listPayments(params: { limit?: number; offset?: number }) {
	const supabase = getSupabaseAdmin()
	const { limit = 50, offset = 0 } = params
	const { data, error } = await supabase
		.from('payment_history')
		.select('id, user_id, amount, currency, status, created_at')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1)
	console.log('Payments query result:', { data, error })
	if (error) throw error
	return (data || []) as Array<{
		id: string | number
		user_id: number
		amount: number
		currency: string | null
		status: string | null
		created_at: string
		description?: string | null
	}>
}

// Additional list helpers for other tables

export async function listTransactions(params: { limit?: number; offset?: number }) {
	const supabase = getSupabaseAdmin()
	const { limit = 50, offset = 0 } = params
	const { data, error } = await supabase
		.from('transactions')
		.select('id, user_id, category_id, amount, type, currency, date, created_at, source, title, description, voice_log_id, user:users!transactions_user_id_fkey(id, username, first_name, last_name, display_name), category:categories!transactions_category_id_fkey(id, name)')
		.order('date', { ascending: false })
		.range(offset, offset + limit - 1)
	if (error) throw error
	return data || []
}

export async function listCategories(params: { limit?: number; offset?: number }) {
	const supabase = getSupabaseAdmin()
	const { limit = 100, offset = 0 } = params
	const { data, error } = await supabase
		.from('categories')
		.select('id, name, type, is_default, icon, color, order_index, language, created_at')
		.order('order_index', { ascending: true })
		.range(offset, offset + limit - 1)
	if (error) throw error
	return data || []
}

export async function listCategoryTranslations(params: { limit?: number; offset?: number }) {
	const supabase = getSupabaseAdmin()
	const { limit = 200, offset = 0 } = params
	const { data, error } = await supabase
		.from('category_translations')
		.select('id, category_id, language, name, description, created_at, category:categories!category_translations_category_id_fkey(id, name)')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1)
	if (error) throw error
	return data || []
}

export async function listUserCategories(params: { limit?: number; offset?: number }) {
	const supabase = getSupabaseAdmin()
	const { limit = 200, offset = 0 } = params
	const { data, error } = await supabase
		.from('user_categories')
		.select('user_id, category_id, is_enabled, is_pinned, user_alias, category:categories!user_categories_category_id_fkey(id, name)')
		.order('user_id', { ascending: true })
		.range(offset, offset + limit - 1)
	if (error) throw error
	const rows = (data || []) as Array<any>
	const userIds = Array.from(new Set(rows.map(r => r.user_id).filter((v): v is number => typeof v === 'number')))
	let usersById: Record<number, any> = {}
	if (userIds.length > 0) {
		const { data: users, error: usersErr } = await supabase
			.from('users')
			.select('id, username, first_name, last_name, display_name')
			.in('id', userIds)
		if (!usersErr && users) {
			usersById = Object.fromEntries(users.map(u => [u.id as number, u]))
		}
	}
	return rows.map(r => ({ ...r, user: usersById[r.user_id] || null }))
}

export async function listUserCards(params: { limit?: number; offset?: number }) {
	const supabase = getSupabaseAdmin()
	const { limit = 100, offset = 0 } = params
	const { data, error } = await supabase
		.from('user_cards')
		.select('id, user_id, card_id, card_token, last4, is_active, created_at, updated_at, user:users!user_cards_user_id_fkey(id, username, first_name, last_name, display_name)')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1)
	if (error) throw error
	return data || []
}

export async function listUserSubscriptions(params: { limit?: number; offset?: number }) {
	const supabase = getSupabaseAdmin()
	const { limit = 100, offset = 0 } = params
	const { data, error } = await supabase
		.from('user_subscriptions')
		.select('id, user_id, recurring_id, card_token, amount, currency, status, plan_type, next_payment_date, cancelled_at, last_error, created_at, updated_at, user:users!user_subscriptions_user_id_fkey(id, username, first_name, last_name, display_name)')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1)
	if (error) throw error
	return data || []
}

export async function listMarketingEvents(params: { limit?: number; offset?: number }) {
	const supabase = getSupabaseAdmin()
	const { limit = 100, offset = 0 } = params
	const { data, error } = await supabase
		.from('marketing_events')
		.select('id, created_at, event_name, event_time, event_id, action_source, source, user_id, telegram_id, event_source_url, value, currency, status, error, user:users!marketing_events_user_id_fkey(id, username, first_name, last_name, display_name)')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1)
	if (error) throw error
	return data || []
}

export async function listUsageEvents(params: { limit?: number; offset?: number }) {
	const supabase = getSupabaseAdmin()
	const { limit = 100, offset = 0 } = params
	const { data, error } = await supabase
		.from('usage_events')
		.select('id, created_at, user_id, telegram_id, feature, input_bytes, output_tokens, status, latency_ms')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1)
	if (error) throw error
	return data || []
}

export async function listBotNotifications(params: { limit?: number; offset?: number }) {
	const supabase = getSupabaseAdmin()
	const { limit = 100, offset = 0 } = params
	const { data, error } = await supabase
		.from('bot_notifications')
		.select('id, created_at, sent_at, attempts, dedupe_key, user_id, telegram_chat_id, telegram_message_id, batch_id, index_in_batch, total_in_batch, status')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1)
	if (error) throw error
	return data || []
}

export async function listBudgets(params: { limit?: number; offset?: number }) {
	const supabase = getSupabaseAdmin()
	const { limit = 100, offset = 0 } = params
	const { data, error } = await supabase
		.from('budgets')
		.select('id, user_id, category_id, amount, currency, start_date, end_date, created_at, user:users!budgets_user_id_fkey(id, username, first_name, last_name, display_name), category:categories!budgets_category_id_fkey(id, name)')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1)
	if (error) throw error
	return data || []
}

export async function listGoals(params: { limit?: number; offset?: number }) {
	const supabase = getSupabaseAdmin()
	const { limit = 100, offset = 0 } = params
	const { data, error } = await supabase
		.from('goals')
		.select('id, user_id, name, target_amount, currency, start_date, end_date, created_at, user:users!goals_user_id_fkey(id, username, first_name, last_name, display_name)')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1)
	if (error) throw error
	return data || []
}

export async function listGoalContributions(params: { limit?: number; offset?: number }) {
	const supabase = getSupabaseAdmin()
	const { limit = 100, offset = 0 } = params
	const { data, error } = await supabase
		.from('goal_contributions')
		.select('id, goal_id, user_id, transaction_id, amount, created_at, user:users!goal_contributions_user_id_fkey(id, username, first_name, last_name, display_name), goal:goals!goal_contributions_goal_id_fkey(id, name)')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1)
	if (error) throw error
	return data || []
}
