import { getSupabaseAdmin } from '@/lib/supabase-admin'

export type SegmentOperator =
  | 'eq'
  | 'neq'
  | 'in'
  | 'not_in'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'before'
  | 'after'
  | 'within_days'
  | 'is_null'
  | 'not_null'

export type SegmentFilter = {
  field: string
  op: SegmentOperator
  value?: any
}

export type SegmentLogic = 'and' | 'or'

function toISODateFromDaysAgo(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - Math.max(0, Number(days) || 0))
  return d.toISOString()
}

async function getAllUserIds(): Promise<Set<number>> {
  const supabase = getSupabaseAdmin()
  const ids = new Set<number>()
  const pageSize = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)
    if (error) throw error
    const rows = data || []
    rows.forEach(r => { if (typeof r.id === 'number') ids.add(r.id) })
    if (rows.length < pageSize) break
    from += pageSize
  }
  return ids
}

async function mapTelegramIdsToUserIds(telegramIds: number[]): Promise<Set<number>> {
  const supabase = getSupabaseAdmin()
  const ids = new Set<number>()
  if (telegramIds.length === 0) return ids
  const chunks: number[][] = []
  for (let i = 0; i < telegramIds.length; i += 1000) chunks.push(telegramIds.slice(i, i + 1000))
  for (const chunk of chunks) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .in('telegram_id', chunk)
    if (error) throw error
    ;(data || []).forEach(r => { if (typeof r.id === 'number') ids.add(r.id) })
  }
  return ids
}

function intersectSets(a: Set<number>, b: Set<number>): Set<number> {
  if (a.size === 0 || b.size === 0) return new Set()
  const small = a.size < b.size ? a : b
  const large = a.size < b.size ? b : a
  const out = new Set<number>()
  small.forEach(v => { if (large.has(v)) out.add(v) })
  return out
}

function differenceSets(a: Set<number>, b: Set<number>): Set<number> {
  const out = new Set<number>()
  a.forEach(v => { if (!b.has(v)) out.add(v) })
  return out
}

function unionSets(a: Set<number>, b: Set<number>): Set<number> {
  const out = new Set<number>()
  a.forEach(v => out.add(v))
  b.forEach(v => out.add(v))
  return out
}

async function getUserIdsForUsersFilter(filter: SegmentFilter): Promise<Set<number>> {
  const supabase = getSupabaseAdmin()
  let query = supabase.from('users').select('id')
  const [, col] = filter.field.split('.')
  const v = filter.value
  switch (filter.op) {
    case 'eq': query = query.eq(col, v); break
    case 'neq': query = query.neq(col, v); break
    case 'in': query = query.in(col, Array.isArray(v) ? v : [v]); break
    case 'not_in': query = query.not(col, 'in', Array.isArray(v) ? v : [v]); break
    case 'gt': query = query.gt(col, v); break
    case 'gte': query = query.gte(col, v); break
    case 'lt': query = query.lt(col, v); break
    case 'lte': query = query.lte(col, v); break
    case 'between':
      if (Array.isArray(v) && v.length === 2) { query = query.gte(col, v[0]).lte(col, v[1]) }
      break
    case 'before': query = query.lt(col, v); break
    case 'after': query = query.gt(col, v); break
    case 'within_days': query = query.gte(col, toISODateFromDaysAgo(Number(v) || 0)); break
    case 'is_null': query = query.is(col, null as any); break
    case 'not_null': query = query.not(col, 'is', null as any); break
  }
  const { data, error } = await query
  if (error) throw error
  const ids = new Set<number>()
  ;(data || []).forEach(r => { if (typeof (r as any).id === 'number') ids.add((r as any).id) })
  return ids
}

async function getUserIdsForTransactionsFilter(filter: SegmentFilter): Promise<Set<number>> {
  const supabase = getSupabaseAdmin()
  let query = supabase.from('transactions').select('user_id')
  const [, col] = filter.field.split('.')
  const v = filter.value
  switch (filter.op) {
    case 'eq': query = query.eq(col, v); break
    case 'neq': query = query.neq(col, v); break
    case 'in': query = query.in(col, Array.isArray(v) ? v : [v]); break
    case 'not_in': query = query.not(col, 'in', Array.isArray(v) ? v : [v]); break
    case 'gt': query = query.gt(col, v); break
    case 'gte': query = query.gte(col, v); break
    case 'lt': query = query.lt(col, v); break
    case 'lte': query = query.lte(col, v); break
    case 'between':
      if (Array.isArray(v) && v.length === 2) { query = query.gte(col, v[0]).lte(col, v[1]) }
      break
    case 'before': query = query.lt(col, v); break
    case 'after': query = query.gt(col, v); break
    case 'within_days': query = query.gte(col, toISODateFromDaysAgo(Number(v) || 0)); break
    case 'is_null': query = query.is(col, null as any); break
    case 'not_null': query = query.not(col, 'is', null as any); break
  }
  const { data, error } = await query
  if (error) throw error
  const ids = new Set<number>()
  ;(data || []).forEach(r => { const uid = (r as any).user_id; if (typeof uid === 'number') ids.add(uid) })
  return ids
}

async function getUserIdsForMarketingFilter(filter: SegmentFilter): Promise<Set<number>> {
  const supabase = getSupabaseAdmin()
  let query = supabase.from('marketing_events').select('user_id, telegram_id')
  const [, col] = filter.field.split('.')
  const v = filter.value
  switch (filter.op) {
    case 'eq': query = query.eq(col, v); break
    case 'neq': query = query.neq(col, v); break
    case 'in': query = query.in(col, Array.isArray(v) ? v : [v]); break
    case 'not_in': query = query.not(col, 'in', Array.isArray(v) ? v : [v]); break
    case 'gt': query = query.gt(col, v); break
    case 'gte': query = query.gte(col, v); break
    case 'lt': query = query.lt(col, v); break
    case 'lte': query = query.lte(col, v); break
    case 'between':
      if (Array.isArray(v) && v.length === 2) { query = query.gte(col, v[0]).lte(col, v[1]) }
      break
    case 'before': query = query.lt(col, v); break
    case 'after': query = query.gt(col, v); break
    case 'within_days': query = query.gte(col, toISODateFromDaysAgo(Number(v) || 0)); break
    case 'is_null': query = query.is(col, null as any); break
    case 'not_null': query = query.not(col, 'is', null as any); break
  }
  const { data, error } = await query
  if (error) throw error
  const userIds = new Set<number>()
  const tgIds: number[] = []
  ;(data || []).forEach(r => {
    const uid = (r as any).user_id
    const tg = (r as any).telegram_id
    if (typeof uid === 'number') userIds.add(uid)
    else if (typeof tg === 'number') tgIds.push(tg)
  })
  if (tgIds.length > 0) {
    const mapped = await mapTelegramIdsToUserIds(Array.from(new Set(tgIds)))
    mapped.forEach(id => userIds.add(id))
  }
  return userIds
}

async function getUserIdsForUsageFilter(filter: SegmentFilter): Promise<Set<number>> {
  // usage_events: has user_id and telegram_id; input_usage: only telegram_id
  const [, col] = filter.field.split('.')
  if (filter.field.startsWith('usage_events.')) {
    const supabase = getSupabaseAdmin()
    let query = supabase.from('usage_events').select('user_id, telegram_id, created_at')
    const v = filter.value
    switch (filter.op) {
      case 'eq': query = query.eq(col, v); break
      case 'neq': query = query.neq(col, v); break
      case 'in': query = query.in(col, Array.isArray(v) ? v : [v]); break
      case 'not_in': query = query.not(col, 'in', Array.isArray(v) ? v : [v]); break
      case 'gt': query = query.gt(col, v); break
      case 'gte': query = query.gte(col, v); break
      case 'lt': query = query.lt(col, v); break
      case 'lte': query = query.lte(col, v); break
      case 'between':
        if (Array.isArray(v) && v.length === 2) { query = query.gte(col, v[0]).lte(col, v[1]) }
        break
      case 'before': query = query.lt(col, v); break
      case 'after': query = query.gt(col, v); break
      case 'within_days': query = query.gte(col, toISODateFromDaysAgo(Number(v) || 0)); break
      case 'is_null': query = query.is(col, null as any); break
      case 'not_null': query = query.not(col, 'is', null as any); break
    }
    const { data, error } = await query
    if (error) throw error
    const out = new Set<number>()
    const tgIds: number[] = []
    ;(data || []).forEach(r => {
      const uid = (r as any).user_id
      const tg = (r as any).telegram_id
      if (typeof uid === 'number') out.add(uid)
      else if (typeof tg === 'number') tgIds.push(tg)
    })
    if (tgIds.length > 0) {
      const mapped = await mapTelegramIdsToUserIds(Array.from(new Set(tgIds)))
      mapped.forEach(id => out.add(id))
    }
    return out
  }
  if (filter.field.startsWith('input_usage.')) {
    const supabase = getSupabaseAdmin()
    let query = supabase.from('input_usage').select('telegram_id')
    const v = filter.value
    switch (filter.op) {
      case 'eq': query = query.eq(col, v); break
      case 'neq': query = query.neq(col, v); break
      case 'in': query = query.in(col, Array.isArray(v) ? v : [v]); break
      case 'not_in': query = query.not(col, 'in', Array.isArray(v) ? v : [v]); break
      default: break
    }
    const { data, error } = await query
    if (error) throw error
    const tgIds = Array.from(new Set((data || []).map(r => (r as any).telegram_id).filter((v: any) => typeof v === 'number')))
    return await mapTelegramIdsToUserIds(tgIds)
  }
  return new Set<number>()
}

async function getUserIdsForSubscriptionsFilter(filter: SegmentFilter): Promise<Set<number>> {
  const supabase = getSupabaseAdmin()
  let query = supabase.from('user_subscriptions').select('user_id')
  const [, col] = filter.field.split('.')
  const v = filter.value
  switch (filter.op) {
    case 'eq': query = query.eq(col, v); break
    case 'neq': query = query.neq(col, v); break
    case 'in': query = query.in(col, Array.isArray(v) ? v : [v]); break
    case 'not_in': query = query.not(col, 'in', Array.isArray(v) ? v : [v]); break
    case 'gt': query = query.gt(col, v); break
    case 'gte': query = query.gte(col, v); break
    case 'lt': query = query.lt(col, v); break
    case 'lte': query = query.lte(col, v); break
    case 'between':
      if (Array.isArray(v) && v.length === 2) { query = query.gte(col, v[0]).lte(col, v[1]) }
      break
    case 'before': query = query.lt(col, v); break
    case 'after': query = query.gt(col, v); break
    case 'within_days': query = query.gte(col, toISODateFromDaysAgo(Number(v) || 0)); break
    case 'is_null': query = query.is(col, null as any); break
    case 'not_null': query = query.not(col, 'is', null as any); break
  }
  const { data, error } = await query
  if (error) throw error
  const ids = new Set<number>()
  ;(data || []).forEach(r => { const uid = (r as any).user_id; if (typeof uid === 'number') ids.add(uid) })
  return ids
}

async function getUserIdsForCardsFilter(filter: SegmentFilter): Promise<Set<number>> {
  const supabase = getSupabaseAdmin()
  let query = supabase.from('user_cards').select('user_id')
  const [, col] = filter.field.split('.')
  const v = filter.value
  switch (filter.op) {
    case 'eq': query = query.eq(col, v); break
    case 'neq': query = query.neq(col, v); break
    default: break
  }
  const { data, error } = await query
  if (error) throw error
  const ids = new Set<number>()
  ;(data || []).forEach(r => { const uid = (r as any).user_id; if (typeof uid === 'number') ids.add(uid) })
  return ids
}

async function getUserIdsForBudgetsFilter(filter: SegmentFilter): Promise<Set<number>> {
  const supabase = getSupabaseAdmin()
  let query = supabase.from('budgets').select('user_id')
  const [, col] = filter.field.split('.')
  const v = filter.value
  switch (filter.op) {
    case 'eq':
      // special: allow field 'has_budgets'
      if (col === 'has_budgets' && (v === true || v === 'true')) {
        // any budget rows -> users present here
        const { data, error } = await supabase.from('budgets').select('user_id')
        if (error) throw error
        const ids = new Set<number>()
        ;(data || []).forEach(r => { const uid = (r as any).user_id; if (typeof uid === 'number') ids.add(uid) })
        return ids
      }
      query = query.eq(col, v)
      break
    case 'neq': query = query.neq(col, v); break
    case 'in': query = query.in(col, Array.isArray(v) ? v : [v]); break
    case 'not_in': query = query.not(col, 'in', Array.isArray(v) ? v : [v]); break
    case 'gt': query = query.gt(col, v); break
    case 'gte': query = query.gte(col, v); break
    case 'lt': query = query.lt(col, v); break
    case 'lte': query = query.lte(col, v); break
    case 'between':
      if (Array.isArray(v) && v.length === 2) { query = query.gte(col, v[0]).lte(col, v[1]) }
      break
    case 'before': query = query.lt(col, v); break
    case 'after': query = query.gt(col, v); break
  }
  const { data, error } = await query
  if (error) throw error
  const ids = new Set<number>()
  ;(data || []).forEach(r => { const uid = (r as any).user_id; if (typeof uid === 'number') ids.add(uid) })
  return ids
}

async function getUserIdsForNotificationsFilter(filter: SegmentFilter): Promise<Set<number>> {
  const supabase = getSupabaseAdmin()
  let query = supabase.from('user_notifications').select('user_id')
  const [, col] = filter.field.split('.')
  const v = filter.value
  switch (filter.op) {
    case 'eq': query = query.eq(col, v); break
    case 'neq': query = query.neq(col, v); break
    case 'in': query = query.in(col, Array.isArray(v) ? v : [v]); break
    case 'not_in': query = query.not(col, 'in', Array.isArray(v) ? v : [v]); break
    case 'before': query = query.lt(col, v); break
    case 'after': query = query.gt(col, v); break
    case 'within_days': query = query.gte(col, toISODateFromDaysAgo(Number(v) || 0)); break
  }
  const { data, error } = await query
  if (error) throw error
  const ids = new Set<number>()
  ;(data || []).forEach(r => { const uid = (r as any).user_id; if (typeof uid === 'number') ids.add(uid) })
  return ids
}

export async function resolveFiltersToUserIds(filters: SegmentFilter[], logic: SegmentLogic = 'and'): Promise<number[]> {
  if (!filters || filters.length === 0) {
    // no filters -> default to allowlist behavior should be respected by downstream bot
    return []
  }
  // Combine by logic across filters
  let current: Set<number> | null = null
  for (const f of filters) {
    const prefix = f.field.split('.')[0]
    let set: Set<number> = new Set()
    if (prefix === 'users') set = await getUserIdsForUsersFilter(f)
    else if (prefix === 'transactions') set = await getUserIdsForTransactionsFilter(f)
    else if (prefix === 'marketing_events') set = await getUserIdsForMarketingFilter(f)
    else if (prefix === 'usage_events' || prefix === 'input_usage') set = await getUserIdsForUsageFilter(f)
    else if (prefix === 'user_subscriptions') set = await getUserIdsForSubscriptionsFilter(f)
    else if (prefix === 'user_cards') set = await getUserIdsForCardsFilter(f)
    else if (prefix === 'budgets') set = await getUserIdsForBudgetsFilter(f)
    else if (prefix === 'user_notifications') set = await getUserIdsForNotificationsFilter(f)
    else if (prefix === 'derived') {
      // simple derived helpers
      if (f.field === 'derived.has_active_subscription' && f.op === 'eq') {
        set = await getUserIdsForSubscriptionsFilter({ field: 'user_subscriptions.status', op: 'eq', value: 'active' })
        if (f.value === false) {
          const all = await getAllUserIds()
          set = differenceSets(all, set)
        }
      } else if (f.field === 'derived.has_cards' && f.op === 'eq') {
        set = await getUserIdsForCardsFilter({ field: 'user_cards.is_active', op: 'eq', value: true })
        if (f.value === false) {
          const all = await getAllUserIds()
          set = differenceSets(all, set)
        }
      }
    }
    if (current === null) current = set
    else current = (logic === 'or') ? unionSets(current, set) : intersectSets(current, set)
    if (current.size === 0) break
  }
  return Array.from(current || [])
}

export async function previewSegment(filters: SegmentFilter[], sampleSize = 20, logic: SegmentLogic = 'and') {
  const userIds = await resolveFiltersToUserIds(filters, logic)
  const supabase = getSupabaseAdmin()
  const sampleIds = userIds.slice(0, Math.max(1, Math.min(sampleSize, 50)))
  let sample: Array<{ id: number; username: string | null; display_name: string | null; language: string | null }>
    = []
  if (sampleIds.length > 0) {
    const { data } = await supabase
      .from('users')
      .select('id, username, display_name, language')
      .in('id', sampleIds)
    sample = (data || []) as any
  }
  return { count: userIds.length, userIds, sample }
}

export const SUPPORTED_FIELDS: Array<{ group: string; field: string; label: string; type: 'string' | 'number' | 'timestamp' | 'boolean' }>
  = [
    { group: 'Users', field: 'users.language', label: 'User Language', type: 'string' },
    { group: 'Users', field: 'users.default_currency', label: 'User Default Currency', type: 'string' },
    { group: 'Users', field: 'users.created_at', label: 'User Created At', type: 'timestamp' },
    { group: 'Users', field: 'users.is_premium', label: 'User Is Premium', type: 'boolean' },
    { group: 'Users', field: 'users.onboarding_stage', label: 'Onboarding Stage', type: 'string' },
    { group: 'Users', field: 'users.timezone', label: 'User Timezone', type: 'string' },
    { group: 'Users', field: 'users.terms_accepted_at', label: 'Terms Accepted At', type: 'timestamp' },
    { group: 'Users', field: 'users.privacy_accepted_at', label: 'Privacy Accepted At', type: 'timestamp' },
    { group: 'Users', field: 'users.is_blocked', label: 'User Is Blocked', type: 'boolean' },

    { group: 'Transactions', field: 'transactions.type', label: 'Transaction Type', type: 'string' },
    { group: 'Transactions', field: 'transactions.currency', label: 'Transaction Currency', type: 'string' },
    { group: 'Transactions', field: 'transactions.source', label: 'Transaction Source', type: 'string' },
    { group: 'Transactions', field: 'transactions.date', label: 'Transaction Date', type: 'timestamp' },
    { group: 'Transactions', field: 'transactions.amount', label: 'Transaction Amount', type: 'number' },
    { group: 'Transactions', field: 'transactions.category_id', label: 'Transaction Category', type: 'number' },

    { group: 'Subscriptions', field: 'user_subscriptions.status', label: 'Subscription Status', type: 'string' },
    { group: 'Subscriptions', field: 'user_subscriptions.plan_type', label: 'Subscription Plan Type', type: 'string' },
    { group: 'Subscriptions', field: 'user_subscriptions.next_payment_date', label: 'Next Payment Date', type: 'timestamp' },
    { group: 'Subscriptions', field: 'user_subscriptions.cancelled_at', label: 'Subscription Cancelled At', type: 'timestamp' },

    { group: 'Cards', field: 'user_cards.is_active', label: 'Card Is Active', type: 'boolean' },

    { group: 'Marketing', field: 'marketing_events.event_name', label: 'Event Name', type: 'string' },
    { group: 'Marketing', field: 'marketing_events.event_time', label: 'Event Time', type: 'timestamp' },
    { group: 'Marketing', field: 'marketing_events.action_source', label: 'Action Source', type: 'string' },
    { group: 'Marketing', field: 'marketing_events.source', label: 'Source', type: 'string' },

    { group: 'Usage', field: 'usage_events.feature', label: 'Usage Feature', type: 'string' },
    { group: 'Usage', field: 'usage_events.created_at', label: 'Usage Created At', type: 'timestamp' },
    { group: 'Usage', field: 'input_usage.period_key', label: 'Input Usage Period Key', type: 'string' },

    { group: 'Budgets', field: 'budgets.category_id', label: 'Budget Category', type: 'number' },
    { group: 'Budgets', field: 'budgets.currency', label: 'Budget Currency', type: 'string' },
    { group: 'Budgets', field: 'budgets.start_date', label: 'Budget Start Date', type: 'timestamp' },
    { group: 'Budgets', field: 'budgets.end_date', label: 'Budget End Date', type: 'timestamp' },

    { group: 'Notifications', field: 'user_notifications.code', label: 'Notification Code', type: 'string' },
    { group: 'Notifications', field: 'user_notifications.sent_at', label: 'Notification Sent At', type: 'timestamp' },

    { group: 'Derived', field: 'derived.has_active_subscription', label: 'Has Active Subscription', type: 'boolean' },
    { group: 'Derived', field: 'derived.has_cards', label: 'Has Cards', type: 'boolean' },
  ]

export const OPERATORS_BY_TYPE: Record<'string' | 'number' | 'timestamp' | 'boolean', SegmentOperator[]> = {
  string: ['eq', 'neq', 'in', 'not_in', 'is_null', 'not_null'],
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'not_in', 'is_null', 'not_null'],
  timestamp: ['before', 'after', 'between', 'within_days', 'is_null', 'not_null'],
  boolean: ['eq', 'neq'],
}


