'use client'

import { useState } from 'react'
import Link from 'next/link'
import { User, Crown, Calendar, ExternalLink, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AdminUser {
	id: number
	telegram_id: string | null
	username: string | null
	first_name: string | null
	last_name: string | null
	language: string | null
	default_currency: string | null
	is_premium: boolean
	terms_accepted: boolean
	created_at: string | null
}

interface UsersListProps {
	initialUsers: AdminUser[]
	q: string
	hasMore: boolean
}

function formatDate(date: string | null | undefined) {
	if (!date) return '—'
	return new Date(date).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	})
}

export function UsersList({ initialUsers, q, hasMore: initialHasMore }: UsersListProps) {
	const [users, setUsers] = useState(initialUsers)
	const [loading, setLoading] = useState(false)
	const [hasMore, setHasMore] = useState(initialHasMore)
	const [offset, setOffset] = useState(50)

	async function loadMore() {
		setLoading(true)
		try {
			const params = new URLSearchParams({ 
				offset: offset.toString(),
				limit: '50'
			})
			if (q) params.set('q', q)
			
			const res = await fetch(`/api/admin/users/more?${params}`)
			const data = await res.json()
			
			if (data.ok) {
				setUsers([...users, ...data.users])
				setOffset(offset + 50)
				setHasMore(data.hasMore)
			}
		} catch (error) {
			console.error('Error loading more users:', error)
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
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
			
			{hasMore && (
				<div className="p-4 flex justify-center">
					<Button
						onClick={loadMore}
						disabled={loading}
						variant="secondary"
						size="lg"
					>
						{loading ? 'Loading...' : 'Load More Users'}
					</Button>
				</div>
			)}
		</>
	)
}