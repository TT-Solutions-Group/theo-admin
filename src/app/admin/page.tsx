import { fetchStats } from '@/lib/supabase-admin'
import { StatCard } from '@/components/ui/stat-card'
import { Users, TrendingUp, DollarSign, Activity, Repeat } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`
  }
  return `$${amount.toFixed(0)}`
}

export default async function AdminHome() {
  const stats = await fetchStats().catch(() => ({ 
    users: 0, 
    transactions: 0, 
    activeSubscriptions: 0, 
    totalRevenue: 0 
  }))
  
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[rgb(var(--foreground))]">Dashboard</h1>
        <p className="text-[rgb(var(--muted-foreground))] mt-2">
          Welcome to your admin dashboard
        </p>
      </div>
      
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.users}
          icon={Users}
          color="green"
          trend={{ value: 12, isPositive: true }}
        />
        
        {/* Removed Transactions card per request */}
        
        <StatCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions}
          icon={TrendingUp}
          color="purple"
          trend={{ value: 15, isPositive: true }}
        />
        
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="cyan"
          trend={{ value: 22, isPositive: true }}
        />
      </div>
      
      {/* Quick Actions */}
      <Card elevated>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[rgb(var(--whoop-green))]" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/admin/users" 
              className="p-4 rounded-[16px] bg-[rgb(var(--card))] hover:bg-[rgb(var(--card-elevated))] transition-colors block"
            >
              <Users className="w-8 h-8 mb-2 text-[rgb(var(--whoop-green))]" />
              <h3 className="font-semibold mb-1">Manage Users</h3>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                View and edit user profiles
              </p>
            </Link>
            
            <Link 
              href="/admin/subscriptions" 
              className="p-4 rounded-[16px] bg-[rgb(var(--card))] hover:bg-[rgb(var(--card-elevated))] transition-colors block"
            >
              <Repeat className="w-8 h-8 mb-2 text-[rgb(var(--whoop-blue))]" />
              <h3 className="font-semibold mb-1">Manage Subscriptions</h3>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                View and manage user subscriptions
              </p>
            </Link>
            
            <Link 
              href="/admin/users?premium=true" 
              className="p-4 rounded-[16px] bg-[rgb(var(--card))] hover:bg-[rgb(var(--card-elevated))] transition-colors block"
            >
              <TrendingUp className="w-8 h-8 mb-2 text-[rgb(var(--whoop-purple))]" />
              <h3 className="font-semibold mb-1">Premium Users</h3>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                Manage premium subscriptions
              </p>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Activity */}
      <Card elevated>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[rgb(var(--border))]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[rgb(var(--whoop-green))]" />
                <span className="text-sm">New user registered</span>
              </div>
              <span className="text-sm text-[rgb(var(--muted-foreground))]">2 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[rgb(var(--border))]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[rgb(var(--whoop-blue))]" />
                <span className="text-sm">Payment received</span>
              </div>
              <span className="text-sm text-[rgb(var(--muted-foreground))]">15 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[rgb(var(--border))]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[rgb(var(--whoop-purple))]" />
                <span className="text-sm">Subscription upgraded</span>
              </div>
              <span className="text-sm text-[rgb(var(--muted-foreground))]">1 hour ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}