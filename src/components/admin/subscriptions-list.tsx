'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, CreditCard, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface Subscription {
	id: string | number
	user_id: number
	recurring_id: string | null
	card_token: string | null
	amount: number
	currency: string
	status: string | null
	plan_type: string | null
	next_payment_date: string | null
	cancelled_at: string | null
	last_error: string | null
	created_at: string | null
	updated_at: string | null
	user?: {
		id: number
		username: string | null
		first_name: string | null
		last_name: string | null
		display_name: string | null
	}
}

interface SubscriptionsListProps {
	initialSubscriptions: Subscription[]
	groupBy: 'none' | 'user' | 'status' | 'plan'
	hasMore: boolean
}

function formatDate(date: string | null) {
	if (!date) return '—'
	try {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		})
	} catch {
		return date
	}
}

function formatAmount(amount: number, currency?: string | null) {
	return formatCurrency(amount, currency)
}

function getUserName(subscription: Subscription) {
	const user = subscription.user
	if (!user) return `User #${subscription.user_id}`
	return user.username ? `@${user.username}` :
		user.display_name || 
		[user.first_name, user.last_name].filter(Boolean).join(' ') || 
		`User #${subscription.user_id}`
}

function getStatusBadge(status: string | null, cancelled: string | null, error: string | null) {
	if (error) return <Badge variant="red">failed</Badge>
	if (cancelled) return <Badge variant="yellow">cancelled</Badge>
	if (!status) return <Badge variant="default">pending</Badge>
	if (status === 'active') return <Badge variant="green">active</Badge>
	if (status === 'paused') return <Badge variant="yellow">paused</Badge>
	return <Badge variant="default">{status}</Badge>
}

export function SubscriptionsList({ initialSubscriptions, groupBy, hasMore: initialHasMore }: SubscriptionsListProps) {
	const [subscriptions, setSubscriptions] = useState(initialSubscriptions)
	const [loading, setLoading] = useState(false)
	const [hasMore, setHasMore] = useState(initialHasMore)
	const [offset, setOffset] = useState(100)
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

	async function loadMore() {
		setLoading(true)
		try {
			const params = new URLSearchParams({ 
				offset: offset.toString(),
				limit: '100'
			})
			
			const res = await fetch(`/api/admin/subscriptions/more?${params}`)
			const data = await res.json()
			
			if (data.ok) {
				setSubscriptions([...subscriptions, ...data.subscriptions])
				setOffset(offset + 100)
				setHasMore(data.hasMore)
			}
		} catch (error) {
			console.error('Error loading more subscriptions:', error)
		} finally {
			setLoading(false)
		}
	}

	function toggleGroup(groupKey: string) {
		const newExpanded = new Set(expandedGroups)
		if (newExpanded.has(groupKey)) {
			newExpanded.delete(groupKey)
		} else {
			newExpanded.add(groupKey)
		}
		setExpandedGroups(newExpanded)
	}

	// Group subscriptions based on groupBy prop
	let groupedSubscriptions: Record<string, Subscription[]> = {}
	
	if (groupBy === 'none') {
		groupedSubscriptions = { 'all': subscriptions }
	} else if (groupBy === 'user') {
		subscriptions.forEach(s => {
			const key = getUserName(s)
			if (!groupedSubscriptions[key]) groupedSubscriptions[key] = []
			groupedSubscriptions[key].push(s)
		})
	} else if (groupBy === 'status') {
		subscriptions.forEach(s => {
			let key = 'unknown'
			if (s.last_error) key = 'failed'
			else if (s.cancelled_at) key = 'cancelled'
			else if (s.status) key = s.status
			if (!groupedSubscriptions[key]) groupedSubscriptions[key] = []
			groupedSubscriptions[key].push(s)
		})
	} else if (groupBy === 'plan') {
		subscriptions.forEach(s => {
			const key = s.plan_type || 'Unknown Plan'
			if (!groupedSubscriptions[key]) groupedSubscriptions[key] = []
			groupedSubscriptions[key].push(s)
		})
	}

	// Sort group keys
	const sortedGroups = Object.keys(groupedSubscriptions).sort((a, b) => {
		if (groupBy === 'status') {
			const order = ['active', 'paused', 'cancelled', 'failed', 'unknown']
			return order.indexOf(a) - order.indexOf(b)
		}
		return a.localeCompare(b)
	})

	return (
		<>
			<div className="overflow-x-auto">
				{groupBy !== 'none' ? (
					<div className="space-y-4 p-4">
						{sortedGroups.map(groupKey => {
							const groupSubs = groupedSubscriptions[groupKey]
							const isExpanded = expandedGroups.has(groupKey)
							const totalRevenue = groupSubs
								.filter(s => s.status === 'active')
								.reduce((sum, s) => sum + s.amount, 0)
							const activeCount = groupSubs.filter(s => s.status === 'active' && !s.cancelled_at && !s.last_error).length
							const failedCount = groupSubs.filter(s => s.last_error).length
							
							return (
								<div key={groupKey} className="border border-[rgb(var(--border))] rounded-lg">
									<button
										onClick={() => toggleGroup(groupKey)}
										className="w-full p-4 flex items-center justify-between hover:bg-[rgb(var(--card-hover))] transition-colors"
									>
										<div className="flex items-center gap-3">
											{isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
											<div className="text-left">
												<h3 className="font-semibold flex items-center gap-2">
													{groupKey}
													{groupBy === 'status' && (
														groupKey === 'active' ? <Badge variant="green">active</Badge> :
														groupKey === 'cancelled' ? <Badge variant="yellow">cancelled</Badge> :
														groupKey === 'failed' ? <Badge variant="red">failed</Badge> :
														<Badge variant="default">{groupKey}</Badge>
													)}
												</h3>
												<p className="text-sm text-[rgb(var(--muted-foreground))]">
													{groupSubs.length} subscription{groupSubs.length !== 1 ? 's' : ''}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-4">
											{groupBy !== 'status' && (
												<div className="flex items-center gap-3">
													<div className="flex items-center gap-1 text-green-500">
														<CheckCircle className="w-4 h-4" />
														<span className="text-sm font-medium">{activeCount}</span>
													</div>
													{failedCount > 0 && (
														<div className="flex items-center gap-1 text-red-500">
															<AlertCircle className="w-4 h-4" />
															<span className="text-sm font-medium">{failedCount}</span>
														</div>
													)}
												</div>
											)}
											{totalRevenue > 0 && (
												<div className="text-right">
													<p className="text-sm text-[rgb(var(--muted-foreground))]">MRR</p>
													<p className="font-semibold text-green-500">
														{formatAmount(totalRevenue, 'UZS')}
													</p>
												</div>
											)}
										</div>
									</button>
									
									{isExpanded && (
										<div className="border-t border-[rgb(var(--border))]">
											<table className="whoop-table">
												<thead>
													<tr>
														<th>ID</th>
														{groupBy !== 'user' && <th>User</th>}
														{groupBy !== 'status' && <th>Status</th>}
														{groupBy !== 'plan' && <th>Plan</th>}
														<th>Amount</th>
														<th>Next Payment</th>
														<th>Created</th>
														<th>Error</th>
													</tr>
												</thead>
												<tbody>
													{groupSubs.map(s => (
														<tr key={s.id}>
															<td className="font-mono text-sm">#{s.id}</td>
															{groupBy !== 'user' && <td>{getUserName(s)}</td>}
															{groupBy !== 'status' && <td>{getStatusBadge(s.status, s.cancelled_at, s.last_error)}</td>}
															{groupBy !== 'plan' && <td>{s.plan_type || '—'}</td>}
															<td className={s.status === 'active' ? 'text-green-500 font-medium' : ''}>
																{formatAmount(s.amount, s.currency)}
															</td>
															<td>{formatDate(s.next_payment_date)}</td>
															<td>{formatDate(s.created_at)}</td>
															<td className="text-sm text-red-500">{s.last_error || '—'}</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									)}
								</div>
							)
						})}
					</div>
				) : (
					<table className="whoop-table">
						<thead>
							<tr>
								<th>ID</th>
								<th>User</th>
								<th>Status</th>
								<th>Plan</th>
								<th>Amount</th>
								<th>Next Payment</th>
								<th>Created</th>
								<th>Error</th>
							</tr>
						</thead>
						<tbody>
							{subscriptions.length === 0 ? (
								<tr>
									<td colSpan={8} className="text-center py-8 text-[rgb(var(--muted-foreground))]">
										No subscriptions found
									</td>
								</tr>
							) : (
								subscriptions.map(s => (
									<tr key={s.id}>
										<td className="font-mono text-sm">#{s.id}</td>
										<td>{getUserName(s)}</td>
										<td>{getStatusBadge(s.status, s.cancelled_at, s.last_error)}</td>
										<td>{s.plan_type || '—'}</td>
										<td className={s.status === 'active' ? 'text-green-500 font-medium' : ''}>
											{formatAmount(s.amount, s.currency)}
										</td>
										<td>{formatDate(s.next_payment_date)}</td>
										<td>{formatDate(s.created_at)}</td>
										<td className="text-sm text-red-500">{s.last_error || '—'}</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				)}
			</div>
			
			{hasMore && (
				<div className="p-4 flex justify-center">
					<Button
						onClick={loadMore}
						disabled={loading}
						variant="secondary"
						size="lg"
					>
						{loading ? 'Loading...' : 'Load More Subscriptions'}
					</Button>
				</div>
			)}
		</>
	)
}
