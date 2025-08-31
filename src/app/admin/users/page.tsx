import Link from 'next/link'
import { listUsers } from '@/lib/supabase-admin'
import { Search, User, Crown, Calendar, ExternalLink, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; premium?: string }> }) {
	const params = await searchParams
	const q = (params.q || '').trim()
	const premiumFilter = params.premium === 'true'
	let users = await listUsers({ q, limit: 1000, offset: 0 }).catch((error) => {
		console.error('Error fetching users:', error)
		return []
	})
	
	if (premiumFilter) {
		users = users.filter(u => u.is_premium)
	}
	
	function formatDate(date: string | null | undefined) {
		if (!date) return '—'
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		})
	}

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
						{premiumFilter && (
							<input type="hidden" name="premium" value="true" />
						)}
					</form>
				</CardContent>
			</Card>
			
			{/* Users Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card>
					<CardContent className="p-4 flex items-center justify-between">
						<div>
							<p className="text-sm text-[rgb(var(--muted-foreground))]">Total Users</p>
							<p className="text-2xl font-bold">{users.length}</p>
						</div>
						<User className="w-8 h-8 text-[rgb(var(--whoop-green))]" />
					</CardContent>
				</Card>
				
				<Card>
					<CardContent className="p-4 flex items-center justify-between">
						<div>
							<p className="text-sm text-[rgb(var(--muted-foreground))]">Premium Users</p>
							<p className="text-2xl font-bold">{users.filter(u => u.is_premium).length}</p>
						</div>
						<Crown className="w-8 h-8 text-[rgb(var(--whoop-yellow))]" />
					</CardContent>
				</Card>
				
				<Card>
					<CardContent className="p-4 flex items-center justify-between">
						<div>
							<p className="text-sm text-[rgb(var(--muted-foreground))]">Free Users</p>
							<p className="text-2xl font-bold">{users.filter(u => !u.is_premium).length}</p>
						</div>
						<User className="w-8 h-8 text-[rgb(var(--whoop-blue))]" />
					</CardContent>
				</Card>
			</div>
			
			{/* Users Table */}
			<Card elevated>
				<CardHeader>
					<CardTitle>User List</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<table className="whoop-table">
							<thead>
								<tr>
									<th>User</th>
									<th>Telegram ID</th>
									<th>Language</th>
									<th>Currency</th>
									<th>Status</th>
									<th>Terms</th>
									<th>Joined</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{users.length === 0 ? (
									<tr>
										<td colSpan={8} className="text-center py-8 text-[rgb(var(--muted-foreground))]">
											No users found
										</td>
									</tr>
								) : (
									users.map(user => (
										<tr key={user.id}>
											<td>
												<div className="flex items-center gap-3">
													<div className="w-10 h-10 rounded-full bg-[rgb(var(--card-elevated))] flex items-center justify-center">
														<User className="w-5 h-5 text-[rgb(var(--muted-foreground))]" />
													</div>
													<div>
														<p className="font-medium">
															{[user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'User #' + user.id}
														</p>
														{user.username && (
															<p className="text-sm text-[rgb(var(--muted-foreground))]">
																@{user.username}
															</p>
														)}
													</div>
												</div>
											</td>
											<td>
												<span className="font-mono text-sm">{user.telegram_id}</span>
											</td>
											<td>
												<Badge variant="default">
													{user.language || 'en'}
												</Badge>
											</td>
											<td>
												<span className="text-sm uppercase">
													{user.default_currency || 'USD'}
												</span>
											</td>
											<td>
												{user.is_premium ? (
													<Badge variant="yellow">
														<Crown className="w-3 h-3 mr-1" />
														Premium
													</Badge>
												) : (
													<Badge variant="default">Free</Badge>
												)}
											</td>
											<td>
												{user.terms_accepted ? (
													<Badge variant="green">
														<Check className="w-3 h-3 mr-1" />
														Accepted
													</Badge>
												) : (
													<Badge variant="red">
														<X className="w-3 h-3 mr-1" />
														Pending
													</Badge>
												)}
											</td>
											<td>
												<div className="flex items-center gap-2 text-sm text-[rgb(var(--muted-foreground))]">
													<Calendar className="w-4 h-4" />
													{formatDate(user.created_at)}
												</div>
											</td>
											<td>
												<Link href={`/admin/users/${user.id}`}>
													<Button variant="ghost" size="sm">
														<ExternalLink className="w-4 h-4" />
														View
													</Button>
												</Link>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}