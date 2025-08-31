import { getSubscriptionStats, listUserSubscriptions } from '@/lib/supabase-admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SubscriptionsList } from '@/components/admin/subscriptions-list'
import { CreditCard, TrendingUp, AlertCircle, XCircle, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default async function SubscriptionsPage({ searchParams }: { searchParams: Promise<{ groupBy?: string }> }) {
  const params = await searchParams
  const groupBy = (params.groupBy || 'none') as 'none' | 'user' | 'status' | 'plan'
  
  // Fetch initial subscriptions (first 100)
  const subscriptions = await listUserSubscriptions({ limit: 100, offset: 0 }).catch(() => [])
  
  // Fetch stats
  const stats = await getSubscriptionStats().catch(() => ({
    total: 0,
    active: 0,
    cancelled: 0,
    failed: 0,
    mrr: 0,
    planTypes: {}
  }))
  
  const hasMore = subscriptions.length === 100

  function formatAmount(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('UZS', 'UZS')
  }

  // Get plan breakdown
  const planBreakdown = Object.entries(stats.planTypes)
    .sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <p className="text-[rgb(var(--muted-foreground))] mt-2">
          Manage user subscriptions and recurring revenue
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">MRR</p>
                <p className="text-2xl font-bold text-green-500">
                  {formatAmount(stats.mrr)}
                </p>
                <p className="text-xs text-[rgb(var(--muted-foreground))]">Monthly Recurring</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Active</p>
                <p className="text-2xl font-bold text-green-500">
                  {stats.active.toLocaleString()}
                </p>
                <p className="text-xs text-[rgb(var(--muted-foreground))]">subscriptions</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Total</p>
                <p className="text-2xl font-bold">
                  {stats.total.toLocaleString()}
                </p>
                <p className="text-xs text-[rgb(var(--muted-foreground))]">all time</p>
              </div>
              <CreditCard className="w-8 h-8 text-[rgb(var(--whoop-purple))]" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Cancelled</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {stats.cancelled.toLocaleString()}
                </p>
                <p className="text-xs text-[rgb(var(--muted-foreground))]">churned</p>
              </div>
              <XCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Failed</p>
                <p className="text-2xl font-bold text-red-500">
                  {stats.failed.toLocaleString()}
                </p>
                <p className="text-xs text-[rgb(var(--muted-foreground))]">with errors</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Breakdown */}
      {planBreakdown.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[rgb(var(--muted-foreground))] mb-3">Active Plans Distribution</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {planBreakdown.map(([plan, count]) => (
                <div key={plan} className="text-center p-3 bg-[rgb(var(--card-elevated))] rounded-md">
                  <p className="font-semibold capitalize">{plan}</p>
                  <p className="text-2xl font-bold text-[rgb(var(--whoop-green))]">{count}</p>
                  <p className="text-xs text-[rgb(var(--muted-foreground))]">users</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grouping Options */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-[rgb(var(--muted-foreground))]">Group by:</span>
            <div className="flex gap-2">
              <Link href="/admin/subscriptions?groupBy=none">
                <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  groupBy === 'none' 
                    ? 'bg-[rgb(var(--whoop-green))] text-white' 
                    : 'bg-[rgb(var(--card-elevated))] hover:bg-[rgb(var(--card-hover))]'
                }`}>
                  None
                </button>
              </Link>
              <Link href="/admin/subscriptions?groupBy=user">
                <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  groupBy === 'user' 
                    ? 'bg-[rgb(var(--whoop-green))] text-white' 
                    : 'bg-[rgb(var(--card-elevated))] hover:bg-[rgb(var(--card-hover))]'
                }`}>
                  User
                </button>
              </Link>
              <Link href="/admin/subscriptions?groupBy=status">
                <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  groupBy === 'status' 
                    ? 'bg-[rgb(var(--whoop-green))] text-white' 
                    : 'bg-[rgb(var(--card-elevated))] hover:bg-[rgb(var(--card-hover))]'
                }`}>
                  Status
                </button>
              </Link>
              <Link href="/admin/subscriptions?groupBy=plan">
                <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  groupBy === 'plan' 
                    ? 'bg-[rgb(var(--whoop-green))] text-white' 
                    : 'bg-[rgb(var(--card-elevated))] hover:bg-[rgb(var(--card-hover))]'
                }`}>
                  Plan
                </button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions List */}
      <Card elevated>
        <CardHeader>
          <CardTitle>
            Subscription List
            {subscriptions.length > 0 && (
              <span className="text-sm font-normal text-[rgb(var(--muted-foreground))] ml-2">
                (Showing {subscriptions.length} of {stats.total})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <SubscriptionsList 
            initialSubscriptions={subscriptions}
            groupBy={groupBy}
            hasMore={hasMore}
          />
        </CardContent>
      </Card>
    </div>
  )
}