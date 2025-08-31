'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Activity, Calendar, CheckCircle, XCircle, TrendingUp } from 'lucide-react'

interface MarketingEvent {
	id: string | number
	created_at: string | null
	event_name: string
	event_time: string | null
	event_id: string | null
	action_source: string | null
	source: string | null
	user_id: number | null
	telegram_id: string | null
	event_source_url: string | null
	value: number | null
	currency: string | null
	status: string | null
	error: string | null
	user?: {
		id: number
		username: string | null
		first_name: string | null
		last_name: string | null
		display_name: string | null
	}
}

interface MarketingListProps {
	initialEvents: MarketingEvent[]
	groupBy: 'none' | 'user' | 'event' | 'date' | 'status'
	hasMore: boolean
}

function formatDate(date: string | null) {
	if (!date) return '—'
	try {
		return new Date(date).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	} catch {
		return date
	}
}

function getUserName(event: MarketingEvent) {
	if (event.user) {
		return event.user.display_name || 
			[event.user.first_name, event.user.last_name].filter(Boolean).join(' ') || 
			event.user.username || 
			`User #${event.user_id}`
	}
	if (event.user_id) return `User #${event.user_id}`
	if (event.telegram_id) return `Telegram #${event.telegram_id}`
	return 'Unknown'
}

function getStatusBadge(status: string | null) {
	if (!status) return <Badge variant="default">pending</Badge>
	if (status === 'success') return <Badge variant="green">success</Badge>
	if (status === 'failed') return <Badge variant="red">failed</Badge>
	return <Badge variant="default">{status}</Badge>
}

export function MarketingList({ initialEvents, groupBy, hasMore: initialHasMore }: MarketingListProps) {
	const [events, setEvents] = useState(initialEvents)
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
			
			const res = await fetch(`/api/admin/marketing/more?${params}`)
			const data = await res.json()
			
			if (data.ok) {
				setEvents([...events, ...data.events])
				setOffset(offset + 100)
				setHasMore(data.hasMore)
			}
		} catch (error) {
			console.error('Error loading more events:', error)
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

	// Group events based on groupBy prop
	let groupedEvents: Record<string, MarketingEvent[]> = {}
	
	if (groupBy === 'none') {
		groupedEvents = { 'all': events }
	} else if (groupBy === 'user') {
		events.forEach(e => {
			const key = getUserName(e)
			if (!groupedEvents[key]) groupedEvents[key] = []
			groupedEvents[key].push(e)
		})
	} else if (groupBy === 'event') {
		events.forEach(e => {
			const key = e.event_name || 'Unknown Event'
			if (!groupedEvents[key]) groupedEvents[key] = []
			groupedEvents[key].push(e)
		})
	} else if (groupBy === 'status') {
		events.forEach(e => {
			const key = e.status || 'pending'
			if (!groupedEvents[key]) groupedEvents[key] = []
			groupedEvents[key].push(e)
		})
	} else if (groupBy === 'date') {
		events.forEach(e => {
			if (!e.created_at) {
				if (!groupedEvents['Unknown Date']) groupedEvents['Unknown Date'] = []
				groupedEvents['Unknown Date'].push(e)
			} else {
				const key = new Date(e.created_at).toLocaleDateString('en-US', {
					month: 'long',
					day: 'numeric',
					year: 'numeric'
				})
				if (!groupedEvents[key]) groupedEvents[key] = []
				groupedEvents[key].push(e)
			}
		})
	}

	// Sort group keys
	const sortedGroups = Object.keys(groupedEvents).sort((a, b) => {
		if (groupBy === 'date' && a !== 'Unknown Date' && b !== 'Unknown Date') {
			return new Date(b).getTime() - new Date(a).getTime()
		}
		if (groupBy === 'status') {
			const order = ['failed', 'pending', 'success']
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
							const groupEvents = groupedEvents[groupKey]
							const isExpanded = expandedGroups.has(groupKey)
							const successCount = groupEvents.filter(e => e.status === 'success').length
							const failedCount = groupEvents.filter(e => e.status === 'failed').length
							const totalValue = groupEvents.reduce((sum, e) => sum + (e.value || 0), 0)
							
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
													{groupBy === 'status' && getStatusBadge(groupKey)}
												</h3>
												<p className="text-sm text-[rgb(var(--muted-foreground))]">
													{groupEvents.length} events
												</p>
											</div>
										</div>
										<div className="flex items-center gap-4">
											{groupBy !== 'status' && (
												<div className="flex items-center gap-3">
													<div className="flex items-center gap-1 text-green-500">
														<CheckCircle className="w-4 h-4" />
														<span className="text-sm font-medium">{successCount}</span>
													</div>
													<div className="flex items-center gap-1 text-red-500">
														<XCircle className="w-4 h-4" />
														<span className="text-sm font-medium">{failedCount}</span>
													</div>
												</div>
											)}
											{totalValue > 0 && (
												<div className="text-right">
													<p className="text-sm text-[rgb(var(--muted-foreground))]">Total Value</p>
													<p className="font-semibold">{totalValue}</p>
												</div>
											)}
										</div>
									</button>
									
									{isExpanded && (
										<div className="border-t border-[rgb(var(--border))]">
											<table className="whoop-table">
												<thead>
													<tr>
														<th>Date</th>
														{groupBy !== 'event' && <th>Event</th>}
														{groupBy !== 'user' && <th>User</th>}
														<th>Source</th>
														<th>Action</th>
														<th>Value</th>
														{groupBy !== 'status' && <th>Status</th>}
														<th>Error</th>
													</tr>
												</thead>
												<tbody>
													{groupEvents.map(e => (
														<tr key={e.id}>
															<td className="text-sm">{formatDate(e.created_at)}</td>
															{groupBy !== 'event' && <td>{e.event_name}</td>}
															{groupBy !== 'user' && <td>{getUserName(e)}</td>}
															<td>{e.source || '—'}</td>
															<td>{e.action_source || '—'}</td>
															<td>
																{e.value ? (
																	<span>
																		{e.value} {e.currency || ''}
																	</span>
																) : '—'}
															</td>
															{groupBy !== 'status' && <td>{getStatusBadge(e.status)}</td>}
															<td className="text-sm text-red-500">{e.error || '—'}</td>
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
								<th>Date</th>
								<th>Event</th>
								<th>User</th>
								<th>Source</th>
								<th>Action</th>
								<th>Value</th>
								<th>Status</th>
								<th>Error</th>
							</tr>
						</thead>
						<tbody>
							{events.length === 0 ? (
								<tr>
									<td colSpan={8} className="text-center py-8 text-[rgb(var(--muted-foreground))]">
										No events found
									</td>
								</tr>
							) : (
								events.map(e => (
									<tr key={e.id}>
										<td className="text-sm">{formatDate(e.created_at)}</td>
										<td>{e.event_name}</td>
										<td>{getUserName(e)}</td>
										<td>{e.source || '—'}</td>
										<td>{e.action_source || '—'}</td>
										<td>
											{e.value ? (
												<span>
													{e.value} {e.currency || ''}
												</span>
											) : '—'}
										</td>
										<td>{getStatusBadge(e.status)}</td>
										<td className="text-sm text-red-500">{e.error || '—'}</td>
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
						{loading ? 'Loading...' : 'Load More Events'}
					</Button>
				</div>
			)}
		</>
	)
}