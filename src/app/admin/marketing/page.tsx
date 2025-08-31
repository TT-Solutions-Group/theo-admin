import { getMarketingStats, listMarketingEvents } from '@/lib/supabase-admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketingList } from '@/components/admin/marketing-list'
import { Activity, Calendar, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function MarketingPage({ searchParams }: { searchParams: Promise<{ groupBy?: string }> }) {
  const params = await searchParams
  const groupBy = (params.groupBy || 'none') as 'none' | 'user' | 'event' | 'date' | 'status'
  
  // Fetch initial events (first 100)
  const events = await listMarketingEvents({ limit: 100, offset: 0 }).catch(() => [])
  
  // Fetch stats
  const stats = await getMarketingStats().catch(() => ({
    total: 0,
    thisMonth: 0,
    thisWeek: 0,
    success: 0,
    failed: 0,
    eventTypes: {}
  }))
  
  const hasMore = events.length === 100
  
  // Get top event types
  const topEventTypes = Object.entries(stats.eventTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketing Events</h1>
        <p className="text-[rgb(var(--muted-foreground))] mt-2">
          Track events sent to marketing and analytics platforms
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Total Events</p>
                <p className="text-2xl font-bold">
                  {stats.total.toLocaleString()}
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
              </div>
              <Calendar className="w-8 h-8 text-[rgb(var(--whoop-blue))]" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">This Week</p>
                <p className="text-2xl font-bold">
                  {stats.thisWeek.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-[rgb(var(--whoop-green))]" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Success</p>
                <p className="text-2xl font-bold text-green-500">
                  {stats.success.toLocaleString()}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
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
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Event Types */}
      {topEventTypes.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[rgb(var(--muted-foreground))] mb-3">Top Event Types</p>
            <div className="flex gap-4 flex-wrap">
              {topEventTypes.map(([eventType, count]) => (
                <div key={eventType} className="flex items-center gap-2 px-3 py-1.5 bg-[rgb(var(--card-elevated))] rounded-md">
                  <span className="font-medium">{eventType}</span>
                  <span className="text-sm text-[rgb(var(--muted-foreground))]">({count})</span>
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
              <Link href="/admin/marketing?groupBy=none">
                <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  groupBy === 'none' 
                    ? 'bg-[rgb(var(--whoop-green))] text-white' 
                    : 'bg-[rgb(var(--card-elevated))] hover:bg-[rgb(var(--card-hover))]'
                }`}>
                  None
                </button>
              </Link>
              <Link href="/admin/marketing?groupBy=user">
                <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  groupBy === 'user' 
                    ? 'bg-[rgb(var(--whoop-green))] text-white' 
                    : 'bg-[rgb(var(--card-elevated))] hover:bg-[rgb(var(--card-hover))]'
                }`}>
                  User
                </button>
              </Link>
              <Link href="/admin/marketing?groupBy=event">
                <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  groupBy === 'event' 
                    ? 'bg-[rgb(var(--whoop-green))] text-white' 
                    : 'bg-[rgb(var(--card-elevated))] hover:bg-[rgb(var(--card-hover))]'
                }`}>
                  Event Type
                </button>
              </Link>
              <Link href="/admin/marketing?groupBy=status">
                <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  groupBy === 'status' 
                    ? 'bg-[rgb(var(--whoop-green))] text-white' 
                    : 'bg-[rgb(var(--card-elevated))] hover:bg-[rgb(var(--card-hover))]'
                }`}>
                  Status
                </button>
              </Link>
              <Link href="/admin/marketing?groupBy=date">
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

      {/* Events List */}
      <Card elevated>
        <CardHeader>
          <CardTitle>
            Marketing Events
            {events.length > 0 && (
              <span className="text-sm font-normal text-[rgb(var(--muted-foreground))] ml-2">
                (Showing {events.length} of {stats.total})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <MarketingList 
            initialEvents={events}
            groupBy={groupBy}
            hasMore={hasMore}
          />
        </CardContent>
      </Card>
    </div>
  )
}