import { listUsers, getUserStats } from '@/lib/supabase-admin'
import { Search, User, Crown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UsersList } from '@/components/admin/users-list'

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; premium?: string }> }) {
	const params = await searchParams
	const q = (params.q || '').trim()
	
	// Fetch initial users (first 50)
	const users = await listUsers({ q, limit: 50, offset: 0 }).catch((error) => {
		console.error('Error fetching users:', error)
		return []
	})
	
	// Fetch total stats (not limited)
	const stats = await getUserStats(q).catch(() => ({
		total: 0,
		premium: 0,
		free: 0
	}))
	
	const hasMore = users.length === 50

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div>
				<h1 className="text-3xl font-bold text-[rgb(var(--foreground))]">Users</h1>
				<p className="text-[rgb(var(--muted-foreground))] mt-2">
					Manage and view all registered users
				</p>
			</div>
			
			{/* Search Bar */}
			<Card elevated>
				<CardContent className="p-4">
					<form action="/admin/users" className="flex gap-4 flex-col sm:flex-row">
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--muted-foreground))]" />
							<input 
								name="q" 
								defaultValue={q} 
								placeholder="Search by name or username..." 
								className="whoop-input pl-10 w-full" 
							/>
						</div>
						<Button type="submit" variant="primary" size="md">
							Search
						</Button>
					</form>
				</CardContent>
			</Card>
			
			{/* Users Stats - Now showing real totals */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card>
					<CardContent className="p-4 flex items-center justify-between">
						<div>
							<p className="text-sm text-[rgb(var(--muted-foreground))]">Total Users</p>
							<p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
						</div>
						<User className="w-8 h-8 text-[rgb(var(--whoop-green))]" />
					</CardContent>
				</Card>
				
				<Card>
					<CardContent className="p-4 flex items-center justify-between">
						<div>
							<p className="text-sm text-[rgb(var(--muted-foreground))]">Premium Users</p>
							<p className="text-2xl font-bold">{stats.premium.toLocaleString()}</p>
						</div>
						<Crown className="w-8 h-8 text-[rgb(var(--whoop-yellow))]" />
					</CardContent>
				</Card>
				
				<Card>
					<CardContent className="p-4 flex items-center justify-between">
						<div>
							<p className="text-sm text-[rgb(var(--muted-foreground))]">Free Users</p>
							<p className="text-2xl font-bold">{stats.free.toLocaleString()}</p>
						</div>
						<User className="w-8 h-8 text-[rgb(var(--whoop-blue))]" />
					</CardContent>
				</Card>
			</div>
			
			{/* Users Table with Load More */}
			<Card elevated>
				<CardHeader>
					<CardTitle>
						User List 
						{users.length > 0 && (
							<span className="text-sm font-normal text-[rgb(var(--muted-foreground))] ml-2">
								(Showing {users.length} of {stats.total})
							</span>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<UsersList 
						initialUsers={users}
						q={q}
						hasMore={hasMore}
					/>
				</CardContent>
			</Card>
		</div>
	)
}