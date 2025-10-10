import { TransactionsDateRangePicker } from '@/components/admin/transactions-date-range'
import { TransactionsList } from '@/components/admin/transactions-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTransactionStats, listTransactions } from '@/lib/supabase-admin'
import { Activity, Calendar, TrendingDown, TrendingUp } from 'lucide-react'
import Link from 'next/link'

function formatDateRangeLabel(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  const formatter = new Intl.DateTimeFormat('en-US', formatOptions)
  const startLabel = formatter.format(start)
  const endLabel = formatter.format(end)
  return `${startLabel} – ${endLabel}`
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function ensureValidDate(value: string | undefined, fallback: string) {
  if (!value || !DATE_PATTERN.test(value)) return fallback
  return value
}

function buildGroupLink(groupBy: 'none' | 'user' | 'category' | 'date', startDate: string, endDate: string) {
  const params = new URLSearchParams()
  params.set('groupBy', groupBy)
  params.set('startDate', startDate)
  params.set('endDate', endDate)
  return `/admin/transactions?${params.toString()}`
}

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ groupBy?: string; startDate?: string; endDate?: string }> }) {
  const params = await searchParams
  const today = new Date()
  const defaultEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0))
  const defaultStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1, 0, 0, 0, 0))
  const defaultEndString = defaultEnd.toISOString().slice(0, 10)
  const defaultStartString = defaultStart.toISOString().slice(0, 10)

  let startDate = ensureValidDate(params.startDate, defaultStartString)
  let endDate = ensureValidDate(params.endDate, defaultEndString)

  if (new Date(startDate) > new Date(endDate)) {
    startDate = defaultStartString
    endDate = defaultEndString
  }

  const groupBy = (params.groupBy || 'none') as 'none' | 'user' | 'category' | 'date'
  
  // Fetch initial transactions (first 100) for the selected date range
  const transactions = await listTransactions({ limit: 100, offset: 0, startDate, endDate }).catch(() => [] as any[])
  
  // Fetch stats scoped to the selected range
  const stats = await getTransactionStats({ startDate, endDate }).catch(() => ({
    count: 0,
    totalIncome: 0,
    totalExpense: 0,
    netAmount: 0
  }))
  
  const hasMore = transactions.length === 100

  function formatAmount(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('UZS', 'UZS')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-[rgb(var(--muted-foreground))] mt-2">
          Monitor all financial transactions across users
        </p>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">Selected range</p>
            <p className="text-base font-semibold">{formatDateRangeLabel(startDate, endDate)}</p>
          </div>
          <TransactionsDateRangePicker startDate={startDate} endDate={endDate} />
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Total Income</p>
                <p className="text-2xl font-bold text-green-500">
                  {formatAmount(stats.totalIncome)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Total Expense</p>
                <p className="text-2xl font-bold text-red-500">
                  {formatAmount(stats.totalExpense)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Net Amount</p>
                <p className={`text-2xl font-bold ${stats.netAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatAmount(stats.netAmount)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-[rgb(var(--whoop-purple))]" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Transactions</p>
                <p className="text-2xl font-bold">
                  {stats.count.toLocaleString()}
                </p>
                <p className="text-xs text-[rgb(var(--muted-foreground))]">in selected range</p>
              </div>
              <Calendar className="w-8 h-8 text-[rgb(var(--whoop-blue))]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grouping Options */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-[rgb(var(--muted-foreground))]">Group by:</span>
            <div className="flex gap-2">
              <Link href={buildGroupLink('none', startDate, endDate)}>
                <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  groupBy === 'none' 
                    ? 'bg-[rgb(var(--whoop-green))] text-white' 
                    : 'bg-[rgb(var(--card-elevated))] hover:bg-[rgb(var(--card-hover))]'
                }`}>
                  None
                </button>
              </Link>
              <Link href={buildGroupLink('user', startDate, endDate)}>
                <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  groupBy === 'user' 
                    ? 'bg-[rgb(var(--whoop-green))] text-white' 
                    : 'bg-[rgb(var(--card-elevated))] hover:bg-[rgb(var(--card-hover))]'
                }`}>
                  User
                </button>
              </Link>
              <Link href={buildGroupLink('category', startDate, endDate)}>
                <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  groupBy === 'category' 
                    ? 'bg-[rgb(var(--whoop-green))] text-white' 
                    : 'bg-[rgb(var(--card-elevated))] hover:bg-[rgb(var(--card-hover))]'
                }`}>
                  Category
                </button>
              </Link>
              <Link href={buildGroupLink('date', startDate, endDate)}>
                <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  groupBy === 'date' 
                    ? 'bg-[rgb(var(--whoop-green))] text-white' 
                    : 'bg-[rgb(var(--card-elevated))] hover:bg-[rgb(var(--card-hover))]'
                }`}>
                  Date
                </button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card elevated>
        <CardHeader>
          <CardTitle>
            Transaction List
            {transactions.length > 0 && (
              <span className="text-sm font-normal text-[rgb(var(--muted-foreground))] ml-2">
                (Showing {transactions.length} of {stats.count})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TransactionsList 
            initialTransactions={transactions}
            groupBy={groupBy}
            hasMore={hasMore}
          />
        </CardContent>
      </Card>
    </div>
  )
}
