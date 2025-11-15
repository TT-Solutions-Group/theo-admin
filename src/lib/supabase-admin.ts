import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function toStartOfDayISO(date: string | null | undefined) {
	if (!date) return null
	const [year, month, day] = date.split('-').map(Number)
	if (!year || !month || !day) return null
	return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).toISOString()
}

function toEndOfDayISO(date: string | null | undefined) {
	if (!date) return null
	const [year, month, day] = date.split('-').map(Number)
	if (!year || !month || !day) return null
	return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)).toISOString()
}

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
	display_name: string | null
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

export async function getUserStats(q?: string) {
	const supabase = getSupabaseAdmin()
	
	let totalQuery = supabase.from('users').select('id', { count: 'exact', head: true })
	let premiumQuery = supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_premium', true)
	
	if (q && q.trim().length > 0) {
		const searchFilter = `username.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`
		totalQuery = totalQuery.or(searchFilter)
		premiumQuery = premiumQuery.or(searchFilter)
	}
	
	const [totalRes, premiumRes] = await Promise.all([totalQuery, premiumQuery])
	
	return {
		total: totalRes.count ?? 0,
		premium: premiumRes.count ?? 0,
		free: (totalRes.count ?? 0) - (premiumRes.count ?? 0),
	}
}

export async function listUsers(params: { q?: string; limit?: number; offset?: number }) {
	const supabase = getSupabaseAdmin()
	const { q, limit = 25, offset = 0 } = params

	let query = supabase
		.from('users')
		.select('id, telegram_id, username, first_name, last_name, display_name, language, default_currency, is_premium, terms_accepted_at, created_at')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1)

	if (q && q.trim().length > 0) {
		query = query.or(`username.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,display_name.ilike.%${q}%`)
	}

	const { data, error } = await query
	console.log('Users query result:', { data, error })
	if (error) throw error
	return (data || []).map((u) => ({
		...u,
		terms_accepted: Boolean(u.terms_accepted_at),
	})) as AdminUser[]
}

export async function getUserById(id: number) {
	const supabase = getSupabaseAdmin()
	const { data, error } = await supabase
		.from('users')
		.select('id, telegram_id, username, first_name, last_name, display_name, language, default_currency, is_premium, terms_accepted_at, created_at')
		.eq('id', id)
		.single()
	if (error) throw error
	return ({
		...data,
		terms_accepted: Boolean(data?.terms_accepted_at),
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

export async function getTransactionStats(params: { startDate?: string; endDate?: string } = {}) {
	const supabase = getSupabaseAdmin()
  const isoStart = toStartOfDayISO(params.startDate)
  const isoEnd = toEndOfDayISO(params.endDate)

	// Supabase caps select responses at 1000 rows; page through everything so totals stay accurate.
	const sumByType = async (type: 'income' | 'expense') => {
		const pageSize = 1000
		let offset = 0
		let total = 0
		while (true) {
      let query = supabase
        .from('transactions')
        .select('amount')
        .eq('type', type)
        .range(offset, offset + pageSize - 1)
      if (isoStart) query = query.gte('created_at', isoStart)
      if (isoEnd) query = query.lte('created_at', isoEnd)
			const { data, error } = await query
			if (error) throw error
			const rows = data ?? []
			total += rows.reduce((sum, row) => sum + (row.amount ?? 0), 0)
			if (rows.length < pageSize) break
			offset += pageSize
		}
		return total
	}

  let totalQuery = supabase.from('transactions').select('id', { count: 'exact', head: true })
  if (isoStart) totalQuery = totalQuery.gte('created_at', isoStart)
  if (isoEnd) totalQuery = totalQuery.lte('created_at', isoEnd)

	const [totalRes, totalIncome, totalExpense] = await Promise.all([
		totalQuery,
		sumByType('income'),
		sumByType('expense'),
	])

	return {
		count: totalRes.count ?? 0,
		totalIncome,
		totalExpense,
		netAmount: totalIncome - totalExpense
	}
}

export async function listTransactions(params: { limit?: number; offset?: number; userId?: number; categoryId?: number; type?: string; startDate?: string; endDate?: string }) {
	const supabase = getSupabaseAdmin()
	const { limit = 50, offset = 0, userId, categoryId, type, startDate, endDate } = params
	const isoStart = toStartOfDayISO(startDate)
	const isoEnd = toEndOfDayISO(endDate)
	
	let query = supabase
		.from('transactions')
	    .select('id, user_id, category_id, amount, type, currency, date, created_at, source, title, description, voice_log_id, debt_parent_id, debt_direction, user:users!transactions_user_id_fkey(id, username, first_name, last_name, display_name), category:categories!transactions_category_id_fkey(id, name)')
    .order('created_at', { ascending: false })
		.range(offset, offset + limit - 1)

	if (userId) query = query.eq('user_id', userId)
	if (categoryId) query = query.eq('category_id', categoryId)
	if (type) query = query.eq('type', type)
  if (isoStart) query = query.gte('created_at', isoStart)
  if (isoEnd) query = query.lte('created_at', isoEnd)
	
	const { data, error } = await query
	if (error) throw error
  const rows = (data || []) as Array<any>
  // Ensure embedded relations are objects, not arrays
  return rows.map(r => ({
    ...r,
    user: Array.isArray(r?.user) ? r.user[0] : r.user,
    category: Array.isArray(r?.category) ? r.category[0] : r.category,
  }))
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
			.select('id, username, first_name, last_name, display_name, language')
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

export async function getTrialStats() {
	const supabase = getSupabaseAdmin()

	// Count users who have consumed trials (trial_consumed = true)
	const { count, error } = await supabase
		.from('users')
		.select('id', { count: 'exact', head: true })
		.eq('trial_consumed', true)

	if (error) {
		console.error('Error fetching trial stats:', error)
		return { trialUsersCount: 0 }
	}

	return {
		trialUsersCount: count ?? 0
	}
}

export async function getTrialConversionStats() {
	const supabase = getSupabaseAdmin()

	// Get all users who have consumed trials
	const { data: trialUsers, error: trialError } = await supabase
		.from('users')
		.select('id')
		.eq('trial_consumed', true)

	if (trialError) {
		console.error('Error fetching trial users:', trialError)
		return {
			trialUsersCount: 0,
			convertedCount: 0,
			conversionRate: 0
		}
	}

	const trialUsersCount = trialUsers?.length ?? 0

	if (trialUsersCount === 0) {
		return {
			trialUsersCount: 0,
			convertedCount: 0,
			conversionRate: 0
		}
	}

	// Get the user IDs
	const trialUserIds = trialUsers.map(u => u.id)

	// Fetch subscription records for these users that represent a paid plan
	const { data: convertedSubscriptions, error: subsError } = await supabase
		.from('user_subscriptions')
		.select('user_id, status, plan_type')
		.in('user_id', trialUserIds)
		.in('status', ['active', 'cancelled', 'payment_failed'])
		.neq('plan_type', 'trial')

	if (subsError) {
		console.error('Error fetching converted users:', subsError)
		return {
			trialUsersCount,
			convertedCount: 0,
			conversionRate: 0
		}
	}

	const convertedUserIds = new Set((convertedSubscriptions ?? []).map(sub => sub.user_id))
	const converted = convertedUserIds.size
	const conversionRate = trialUsersCount > 0 ? (converted / trialUsersCount) * 100 : 0

	return {
		trialUsersCount,
		convertedCount: converted,
		conversionRate
	}
}

export async function getSubscriptionStats() {
	const supabase = getSupabaseAdmin()

	const [totalRes, activeRes, cancelledRes, failedRes] = await Promise.all([
		supabase.from('user_subscriptions').select('id', { count: 'exact', head: true }),
		supabase.from('user_subscriptions').select('id', { count: 'exact', head: true })
			.eq('status', 'active'),
		supabase.from('user_subscriptions').select('id', { count: 'exact', head: true })
			.not('cancelled_at', 'is', null),
		supabase.from('user_subscriptions').select('id', { count: 'exact', head: true })
			.not('last_error', 'is', null),
	])

	// Calculate MRR (Monthly Recurring Revenue)
	let mrr = 0
	try {
		const { data: activeSubs } = await supabase
			.from('user_subscriptions')
			.select('amount, currency')
			.eq('status', 'active')

		if (activeSubs) {
			mrr = activeSubs.reduce((sum, sub) => sum + (sub.amount || 0), 0)
		}
	} catch (e) {
		console.error('Error calculating MRR:', e)
	}

	// Get plan type breakdown
	const { data: planTypes } = await supabase
		.from('user_subscriptions')
		.select('plan_type')
		.eq('status', 'active')

	const planTypeCount: Record<string, number> = {}
	if (planTypes) {
		planTypes.forEach(s => {
			const plan = s.plan_type || 'unknown'
			planTypeCount[plan] = (planTypeCount[plan] || 0) + 1
		})
	}

	return {
		total: totalRes.count ?? 0,
		active: activeRes.count ?? 0,
		cancelled: cancelledRes.count ?? 0,
		failed: failedRes.count ?? 0,
		mrr,
		planTypes: planTypeCount
	}
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

export async function getMarketingStats() {
	const supabase = getSupabaseAdmin()
	
	const today = new Date()
	const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
	const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay())).toISOString()
	
  const [totalRes, monthRes, weekRes, successRes, failedRes] = await Promise.all([
    supabase.from('marketing_events').select('id', { count: 'exact', head: true }),
    supabase.from('marketing_events').select('id', { count: 'exact', head: true })
      .gte('created_at', startOfMonth),
    supabase.from('marketing_events').select('id', { count: 'exact', head: true })
      .gte('created_at', startOfWeek),
    // Treat 'sent' as success and 'error' as failed
    supabase.from('marketing_events').select('id', { count: 'exact', head: true })
      .in('status', ['success','sent']),
    supabase.from('marketing_events').select('id', { count: 'exact', head: true })
      .in('status', ['failed','error']),
  ])
	
	// Get event type breakdown
	const { data: eventTypes } = await supabase
		.from('marketing_events')
		.select('event_name')
	
	const eventTypeCount: Record<string, number> = {}
	if (eventTypes) {
		eventTypes.forEach(e => {
			eventTypeCount[e.event_name] = (eventTypeCount[e.event_name] || 0) + 1
		})
	}
	
	return {
		total: totalRes.count ?? 0,
		thisMonth: monthRes.count ?? 0,
		thisWeek: weekRes.count ?? 0,
		success: successRes.count ?? 0,
		failed: failedRes.count ?? 0,
		eventTypes: eventTypeCount
	}
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

// ==================== COHORT ANALYTICS ====================

import {
	startOfWeek,
	startOfMonth,
	startOfDay,
	format,
	differenceInDays,
	differenceInWeeks,
	differenceInMonths,
	addDays,
	addWeeks,
	addMonths,
	parseISO
} from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

export type CohortBucket = 'daily' | 'weekly' | 'monthly'
// Anchors from cohort.md spec
export type CohortAnchor = 'acquisition' | 'activation' | 'billing' | 'trial'
// Active definitions from cohort.md spec
export type ActiveDefinition = 'entries_only' | 'miniapp_only' | 'entries_or_miniapp' | 'entries_and_miniapp'

export type CohortRow = {
	cohort_key: string // e.g., "2025-W01", "2025-01", "2025-01-15"
	cohort_date: Date
	cohort_size: number
	users: number[] // user IDs in this cohort
	windows: Record<string, number> // Retention rates: { "W0": 1.0, "W1": 0.85, "W2": 0.72, ... }
	absolute: Record<string, number> // Absolute numbers: { "W0": 100, "W1": 85, "W2": 72, ... }
	revenue?: Record<string, number> // Revenue per window (optional)
}

export type CohortData = {
	rows: CohortRow[]
	totalUsers: number
	avgRetention: Record<string, number>
	bestCohort: string | null
}

/**
 * Format date to cohort key based on bucket type
 */
function formatCohortKey(date: Date, bucket: CohortBucket): string {
	switch (bucket) {
		case 'daily':
			return format(date, 'yyyy-MM-dd')
		case 'weekly':
			return format(date, 'yyyy-\'W\'II') // ISO week: 2025-W01
		case 'monthly':
			return format(date, 'yyyy-MM')
	}
}

/**
 * Get the start of period for a date based on bucket
 */
function getStartOfPeriod(date: Date, bucket: CohortBucket): Date {
	switch (bucket) {
		case 'daily':
			return startOfDay(date)
		case 'weekly':
			return startOfWeek(date, { weekStartsOn: 1 }) // Monday
		case 'monthly':
			return startOfMonth(date)
	}
}

/**
 * Calculate time difference in periods
 */
function getDifference(start: Date, end: Date, bucket: CohortBucket): number {
	switch (bucket) {
		case 'daily':
			return differenceInDays(end, start)
		case 'weekly':
			return differenceInWeeks(end, start)
		case 'monthly':
			return differenceInMonths(end, start)
	}
}

/**
 * Add periods to a date
 */
function addPeriod(date: Date, periods: number, bucket: CohortBucket): Date {
	switch (bucket) {
		case 'daily':
			return addDays(date, periods)
		case 'weekly':
			return addWeeks(date, periods)
		case 'monthly':
			return addMonths(date, periods)
	}
}

const DEFAULT_TIMEZONE = 'Asia/Tashkent' // UTC+5

/**
 * Get user's anchor event timestamp based on anchor type
 * Uses workarounds for missing database fields
 */
async function getUserAnchorEvents(
	anchor: CohortAnchor,
	timezone: string = DEFAULT_TIMEZONE
): Promise<Map<number, Date>> {
	const supabase = getSupabaseAdmin()
	const userAnchors = new Map<number, Date>()

	switch (anchor) {
		case 'acquisition': {
			// Workaround: use users.created_at (registration ~= onboarding completion)
			const { data: users } = await supabase
				.from('users')
				.select('id, created_at')
				.not('created_at', 'is', null)

			if (users) {
				for (const user of users) {
					const date = parseISO(user.created_at)
					const zonedDate = toZonedTime(date, timezone)
					userAnchors.set(user.id, zonedDate)
				}
			}
			break
		}

		case 'activation': {
			// Workaround: use first transaction as activation event
			const { data: transactions } = await supabase
				.from('transactions')
				.select('user_id, created_at')
				.order('created_at', { ascending: true })

			if (transactions) {
				const firstTxByUser = new Map<number, string>()
				for (const tx of transactions) {
					if (!firstTxByUser.has(tx.user_id)) {
						firstTxByUser.set(tx.user_id, tx.created_at)
					}
				}

				for (const [userId, createdAt] of firstTxByUser.entries()) {
					const date = parseISO(createdAt)
					const zonedDate = toZonedTime(date, timezone)
					userAnchors.set(userId, zonedDate)
				}
			}
			break
		}

		case 'billing': {
			// Workaround: use first successful payment from payment_history
			const { data: payments } = await supabase
				.from('payment_history')
				.select('user_id, created_at, status')
				.order('created_at', { ascending: true })

			if (payments) {
				const firstPaymentByUser = new Map<number, string>()
				for (const payment of payments) {
					// Only consider successful/completed payments
					if (payment.status && ['success', 'completed', 'paid'].includes(payment.status.toLowerCase())) {
						if (!firstPaymentByUser.has(payment.user_id)) {
							firstPaymentByUser.set(payment.user_id, payment.created_at)
						}
					}
				}

				for (const [userId, createdAt] of firstPaymentByUser.entries()) {
					const date = parseISO(createdAt)
					const zonedDate = toZonedTime(date, timezone)
					userAnchors.set(userId, zonedDate)
				}
			}
			break
		}

		case 'trial': {
			// Workaround: use first subscription creation as trial start
			// Note: In production you'd filter by plan_type='trial' or similar
			const { data: subscriptions } = await supabase
				.from('user_subscriptions')
				.select('user_id, created_at')
				.order('created_at', { ascending: true })

			if (subscriptions) {
				const firstSubByUser = new Map<number, string>()
				for (const sub of subscriptions) {
					if (!firstSubByUser.has(sub.user_id)) {
						firstSubByUser.set(sub.user_id, sub.created_at)
					}
				}

				for (const [userId, createdAt] of firstSubByUser.entries()) {
					const date = parseISO(createdAt)
					const zonedDate = toZonedTime(date, timezone)
					userAnchors.set(userId, zonedDate)
				}
			}
			break
		}
	}

	return userAnchors
}


/**
 * Data structure for bulk activity lookups (SUPER OPTIMIZED)
 */
type ActivityData = {
	transactions: Map<number, Date[]> // userId -> array of transaction dates
	miniappEvents: Map<number, Date[]> // userId -> array of miniapp event dates
}

/**
 * Fetch ALL activity data for given users in ONE BATCH (2 queries total)
 * This is dramatically faster than fetching per-period
 */
async function fetchAllActivityData(
	userIds: number[],
	minDate: Date,
	maxDate: Date,
	activeDefinition: ActiveDefinition,
	timezone: string = DEFAULT_TIMEZONE
): Promise<ActivityData> {
	const supabase = getSupabaseAdmin()

	// Convert to UTC for database queries
	const utcMin = fromZonedTime(minDate, timezone)
	const utcMax = fromZonedTime(maxDate, timezone)

	const transactions = new Map<number, Date[]>()
	const miniappEvents = new Map<number, Date[]>()

	// Fetch ALL transactions for these users in date range (ONE QUERY)
	if (activeDefinition === 'entries_only' || activeDefinition === 'entries_or_miniapp' || activeDefinition === 'entries_and_miniapp') {
		const { data: txData } = await supabase
			.from('transactions')
			.select('user_id, created_at')
			.in('user_id', userIds)
			.gte('created_at', utcMin.toISOString())
			.lt('created_at', utcMax.toISOString())
			.order('created_at', { ascending: true })

		if (txData) {
			for (const tx of txData) {
				const date = toZonedTime(parseISO(tx.created_at), timezone)
				if (!transactions.has(tx.user_id)) {
					transactions.set(tx.user_id, [])
				}
				transactions.get(tx.user_id)!.push(date)
			}
		}
	}

	// Fetch ALL miniapp events for these users in date range (ONE QUERY)
	if (activeDefinition === 'miniapp_only' || activeDefinition === 'entries_or_miniapp' || activeDefinition === 'entries_and_miniapp') {
		const { data: evtData } = await supabase
			.from('marketing_events')
			.select('user_id, created_at')
			.in('user_id', userIds)
			.eq('source', 'mini_app')
			.gte('created_at', utcMin.toISOString())
			.lt('created_at', utcMax.toISOString())
			.order('created_at', { ascending: true })

		if (evtData) {
			for (const evt of evtData) {
				const date = toZonedTime(parseISO(evt.created_at), timezone)
				if (!miniappEvents.has(evt.user_id)) {
					miniappEvents.set(evt.user_id, [])
				}
				miniappEvents.get(evt.user_id)!.push(date)
			}
		}
	}

	return { transactions, miniappEvents }
}

/**
 * Check if user was active in period using pre-loaded activity data (IN-MEMORY)
 */
function isUserActiveInPeriod(
	userId: number,
	periodStart: Date,
	periodEnd: Date,
	activityData: ActivityData,
	activeDefinition: ActiveDefinition
): boolean {
	// Check if user has transactions in period
	const userTransactions = activityData.transactions.get(userId) || []
	const hasEntries = userTransactions.some(date => date >= periodStart && date < periodEnd)

	// Check if user has miniapp events in period
	const userEvents = activityData.miniappEvents.get(userId) || []
	const hasMiniapp = userEvents.some(date => date >= periodStart && date < periodEnd)

	// Apply active definition logic
	switch (activeDefinition) {
		case 'entries_only':
			return hasEntries
		case 'miniapp_only':
			return hasMiniapp
		case 'entries_or_miniapp':
			return hasEntries || hasMiniapp
		case 'entries_and_miniapp':
			return hasEntries && hasMiniapp
		default:
			return false
	}
}

/**
 * Main cohort retention calculation with correct W0, W1, W2 formula
 * W0 = cohort size only (100% by definition)
 * W1 = retention in next period after anchor
 * W2 = retention 2 periods after anchor, etc.
 *
 * OPTIMIZED: Uses batch queries instead of per-user queries
 */
export async function calculateCohortRetention(params: {
	anchor?: CohortAnchor
	activeDefinition?: ActiveDefinition
	bucket?: CohortBucket
	windows?: number
	limit?: number
	startDate?: string
	endDate?: string
	timezone?: string
}): Promise<CohortData> {
	const {
		anchor = 'activation',
		activeDefinition = 'entries_or_miniapp',
		bucket = 'weekly',
		windows = 12,
		limit,
		timezone = DEFAULT_TIMEZONE
	} = params

	// Get user anchor events
	const userAnchors = await getUserAnchorEvents(anchor, timezone)
	if (userAnchors.size === 0) {
		return { rows: [], totalUsers: 0, avgRetention: {}, bestCohort: null }
	}

	// Group users into cohorts by anchor date period
	const cohortsMap = new Map<string, { cohort_key: string; cohort_date: Date; userIds: number[] }>()

	for (const [userId, anchorDate] of userAnchors.entries()) {
		const cohortDate = getStartOfPeriod(anchorDate, bucket)
		const cohortKey = formatCohortKey(cohortDate, bucket)

		if (!cohortsMap.has(cohortKey)) {
			cohortsMap.set(cohortKey, {
				cohort_key: cohortKey,
				cohort_date: cohortDate,
				userIds: []
			})
		}
		cohortsMap.get(cohortKey)!.userIds.push(userId)
	}

	// Sort cohorts by date and apply limit
	const sortedCohorts = Array.from(cohortsMap.values()).sort((a, b) =>
		a.cohort_date.getTime() - b.cohort_date.getTime()
	)
	const limitedCohorts = limit ? sortedCohorts.slice(-limit) : sortedCohorts

	if (limitedCohorts.length === 0) {
		return { rows: [], totalUsers: 0, avgRetention: {}, bestCohort: null }
	}

	// SUPER OPTIMIZATION: Fetch ALL activity data for ALL cohort users ONCE
	// Calculate date range needed: earliest cohort start to latest cohort end + windows
	const earliestCohortDate = limitedCohorts[0].cohort_date
	const latestCohortDate = limitedCohorts[limitedCohorts.length - 1].cohort_date
	const maxPeriodEnd = addPeriod(latestCohortDate, windows + 1, bucket)

	// Collect all unique user IDs across all cohorts
	const allUserIds = Array.from(new Set(limitedCohorts.flatMap(c => c.userIds)))

	// Fetch ALL activity data in ONE BATCH (just 2 queries total!)
	console.log(`[Cohort] Fetching activity data for ${allUserIds.length} users from ${earliestCohortDate.toISOString()} to ${maxPeriodEnd.toISOString()}`)
	const activityData = await fetchAllActivityData(
		allUserIds,
		earliestCohortDate,
		maxPeriodEnd,
		activeDefinition,
		timezone
	)
	console.log(`[Cohort] Activity data loaded: ${activityData.transactions.size} users with transactions, ${activityData.miniappEvents.size} users with miniapp events`)

	// Calculate retention for each cohort using in-memory lookups
	const cohortRows: CohortRow[] = []
	const windowPrefix = bucket === 'daily' ? 'D' : bucket === 'weekly' ? 'W' : 'M'

	for (const cohort of limitedCohorts) {
		const { cohort_key, cohort_date, userIds } = cohort
		const cohortSize = userIds.length
		const windowsData: Record<string, number> = {}
		const absoluteData: Record<string, number> = {}

		// W0 = cohort size (100% by definition)
		windowsData['W0'] = 1.0
		absoluteData['W0'] = cohortSize

		// Calculate retention for W1, W2, W3, ... (periods AFTER cohort anchor)
		for (let w = 1; w <= windows; w++) {
			const periodStart = addPeriod(cohort_date, w, bucket)
			const periodEnd = addPeriod(cohort_date, w + 1, bucket)

			// Count active users in this period using IN-MEMORY lookup (no DB query!)
			let activeCount = 0
			for (const userId of userIds) {
				if (isUserActiveInPeriod(userId, periodStart, periodEnd, activityData, activeDefinition)) {
					activeCount++
				}
			}

			const retentionRate = cohortSize > 0 ? activeCount / cohortSize : 0
			const windowKey = `${windowPrefix}${w}`
			windowsData[windowKey] = retentionRate
			absoluteData[windowKey] = activeCount
		}

		cohortRows.push({
			cohort_key,
			cohort_date,
			cohort_size: cohortSize,
			users: userIds,
			windows: windowsData,
			absolute: absoluteData
		})
	}

	// Calculate average retention across all cohorts (excluding W0)
	const avgRetention: Record<string, number> = {}
	avgRetention['W0'] = 1.0 // Always 100%

	for (let w = 1; w <= windows; w++) {
		const windowKey = `${windowPrefix}${w}`
		const values = cohortRows.map(r => r.windows[windowKey] || 0)
		avgRetention[windowKey] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
	}

	// Find best performing cohort (highest average retention excluding W0)
	let bestCohort: string | null = null
	let bestAvg = 0

	for (const row of cohortRows) {
		const retentionValues = Object.entries(row.windows)
			.filter(([key]) => key !== 'W0') // Exclude W0 from average
			.map(([, value]) => value)

		if (retentionValues.length > 0) {
			const avg = retentionValues.reduce((a, b) => a + b, 0) / retentionValues.length
			if (avg > bestAvg) {
				bestAvg = avg
				bestCohort = row.cohort_key
			}
		}
	}

	return {
		rows: cohortRows,
		totalUsers: cohortRows.reduce((sum, r) => sum + r.cohort_size, 0),
		avgRetention,
		bestCohort
	}
}
