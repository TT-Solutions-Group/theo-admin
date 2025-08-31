import { getTransactionStats, listTransactions } from '@/lib/supabase-admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionsList } from '@/components/admin/transactions-list'
import { TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react'
import Link from 'next/link'

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ groupBy?: string }> }) {
  const params = await searchParams
  const groupBy = (params.groupBy || 'none') as 'none' | 'user' | 'category' | 'date'
  
  // Fetch initial transactions (first 100)
  const transactions = await listTransactions({ limit: 100, offset: 0 }).catch(() => [])
  
  // Fetch stats
  const stats = await getTransactionStats().catch(() => ({
    total: 0,
    thisMonth: 0,
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
                <p className="text-sm text-[rgb(var(--muted-foreground))]">This Month</p>
                <p className="text-2xl font-bold">
                  {stats.thisMonth.toLocaleString()}
                </p>
                <p className="text-xs text-[rgb(var(--muted-foreground))]">transactions</p>
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
              <Link href="/admin/transactions?groupBy=none">
                <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  groupBy === 'none' 
                    ? 'bg-[rgb(var(--whoop-green))] text-white' 
                    : 'bg-[rgb(var(--card-elevated))] hover:bg-[rgb(var(--card-hover))]'
                }`}>
                  None
                </button>
              </Link>
              <Link href="/admin/transactions?groupBy=user">
                <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  groupBy === 'user' 
                    ? 'bg-[rgb(var(--whoop-green))] text-white' 
                    : 'bg-[rgb(var(--card-elevated))] hover:bg-[rgb(var(--card-hover))]'
                }`}>
                  User
                </button>
              </Link>
              <Link href="/admin/transactions?groupBy=category">
                <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  groupBy === 'category' 
                    ? 'bg-[rgb(var(--whoop-green))] text-white' 
                    : 'bg-[rgb(var(--card-elevated))] hover:bg-[rgb(var(--card-hover))]'
                }`}>
                  Category
                </button>
              </Link>
              <Link href="/admin/transactions?groupBy=date">
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
                (Showing {transactions.length} of {stats.total})
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