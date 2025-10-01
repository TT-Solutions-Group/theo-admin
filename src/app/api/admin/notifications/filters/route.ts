import { requireAdmin } from '@/lib/auth'
import { OPERATORS_BY_TYPE, SUPPORTED_FIELDS } from '@/lib/segments'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

type Option = { value: string | number | boolean; label: string }

async function fetchDistinctStrings(table: string, column: string, limit = 500): Promise<string[]> {
  const supabase = getSupabaseAdmin()
  let { data, error } = await supabase
    .from(table as any)
    .select(`${column}`)
    .not(column as any, 'is', null as any)
    .order(column as any, { ascending: true })
    .limit(limit)
  if (error) return []
  const vals = (data || []).map((r: any) => r?.[column]).filter((v: any) => typeof v === 'string' && v.trim().length > 0)
  return Array.from(new Set(vals))
}

async function fetchDistinctEnum(table: string, column: string, limit = 100): Promise<string[]> {
  return await fetchDistinctStrings(table, column, limit)
}

async function fetchCategories(): Promise<Option[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, type, order_index')
    .order('order_index', { ascending: true })
    .limit(500)
  if (error) return []
  return (data || []).map((c: any) => ({ value: c.id, label: `${c.name} (#${c.id})` }))
}

async function fetchOptionsByField(): Promise<Record<string, Option[]>> {
  const options: Record<string, Option[]> = {}

  const [userLangs, userCurrencies, userStages, userTimezones, txCurrencies, txSources, eventNames, actionSources, eventSources, usageFeatures, inputPeriods, budgetCurrencies, notifCodes, categories] = await Promise.all([
    fetchDistinctStrings('users', 'language'),
    fetchDistinctStrings('users', 'default_currency'),
    fetchDistinctStrings('users', 'onboarding_stage'),
    fetchDistinctStrings('users', 'timezone'),
    fetchDistinctStrings('transactions', 'currency'),
    fetchDistinctStrings('transactions', 'source'),
    fetchDistinctStrings('marketing_events', 'event_name'),
    fetchDistinctEnum('marketing_events', 'action_source'),
    fetchDistinctEnum('marketing_events', 'source'),
    fetchDistinctEnum('usage_events', 'feature'),
    fetchDistinctStrings('input_usage', 'period_key'),
    fetchDistinctStrings('budgets', 'currency'),
    fetchDistinctStrings('user_notifications', 'code'),
    fetchCategories(),
  ])

  if (userLangs.length) options['users.language'] = userLangs.map(v => ({ value: v, label: v }))
  if (userCurrencies.length) options['users.default_currency'] = userCurrencies.map(v => ({ value: v, label: v }))
  if (userStages.length) options['users.onboarding_stage'] = userStages.map(v => ({ value: v, label: v }))
  if (userTimezones.length) options['users.timezone'] = userTimezones.map(v => ({ value: v, label: v }))

  options['transactions.type'] = [
    { value: 'income', label: 'income' },
    { value: 'expense', label: 'expense' },
  ]
  if (txCurrencies.length) options['transactions.currency'] = txCurrencies.map(v => ({ value: v, label: v }))
  if (txSources.length) options['transactions.source'] = txSources.map(v => ({ value: v, label: v }))
  if (Array.isArray(categories) && categories.length) {
    options['transactions.category_id'] = categories
    options['budgets.category_id'] = categories
  }

  if (eventNames.length) options['marketing_events.event_name'] = eventNames.map(v => ({ value: v, label: v }))
  if (actionSources.length) options['marketing_events.action_source'] = actionSources.map(v => ({ value: v, label: v }))
  if (eventSources.length) options['marketing_events.source'] = eventSources.map(v => ({ value: v, label: v }))

  if (usageFeatures.length) options['usage_events.feature'] = usageFeatures.map(v => ({ value: v, label: v }))
  if (inputPeriods.length) options['input_usage.period_key'] = inputPeriods.map(v => ({ value: v, label: v }))

  if (budgetCurrencies.length) options['budgets.currency'] = budgetCurrencies.map(v => ({ value: v, label: v }))
  if (notifCodes.length) options['user_notifications.code'] = notifCodes.map(v => ({ value: v, label: v }))

  options['user_subscriptions.status'] = [
    { value: 'active', label: 'active' },
    { value: 'payment_failed', label: 'payment_failed' },
    { value: 'cancelled', label: 'cancelled' },
  ]
  options['user_subscriptions.plan_type'] = [
    { value: 'weekly', label: 'weekly' },
    { value: 'monthly', label: 'monthly' },
  ]

  return options
}

export async function GET(request: NextRequest) {
  const ok = await requireAdmin(request)
  if (!ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  try {
    const options = await fetchOptionsByField()
    return NextResponse.json({ ok: true, fields: SUPPORTED_FIELDS, operators: OPERATORS_BY_TYPE, options })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'filters_meta_failed' }, { status: 500 })
  }
}


