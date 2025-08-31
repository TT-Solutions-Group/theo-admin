'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'

interface Transaction {
	id: string | number
	user_id: number
	category_id: number | null
	amount: number
	type: string
	currency: string | null
	date: string
	created_at: string
	source: string | null
	title: string | null
	description: string | null
	voice_log_id: number | null
	user?: {
		id: number
		username: string | null
		first_name: string | null
		last_name: string | null
		display_name: string | null
	}
	category?: {
		id: number
		name: string
	}
}

interface TransactionsListProps {
	initialTransactions: Transaction[]
	groupBy: 'none' | 'user' | 'category' | 'date'
	hasMore: boolean
}

function formatDate(date: string) {
	try {
		return new Date(date).toLocaleDateString('en-US', {
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

function formatAmount(amount: number, currency: string = 'USD') {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency === 'UZS' ? 'UZS' : currency,
		minimumFractionDigits: currency === 'UZS' ? 0 : 2,
		maximumFractionDigits: currency === 'UZS' ? 0 : 2
	}).format(amount).replace('UZS', 'UZS')
}

function getUserName(transaction: Transaction) {
	const user = transaction.user
	if (!user) return `User #${transaction.user_id}`
	return user.username ? `@${user.username}` :
		user.display_name || 
		[user.first_name, user.last_name].filter(Boolean).join(' ') || 
		`User #${transaction.user_id}`
}

function getCategoryName(transaction: Transaction) {
	return transaction.category?.name || 'Uncategorized'
}

export function TransactionsList({ initialTransactions, groupBy, hasMore: initialHasMore }: TransactionsListProps) {
	const [transactions, setTransactions] = useState(initialTransactions)
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
			
			const res = await fetch(`/api/admin/transactions/more?${params}`)
			const data = await res.json()
			
			if (data.ok) {
				setTransactions([...transactions, ...data.transactions])
				setOffset(offset + 100)
				setHasMore(data.hasMore)
			}
		} catch (error) {
			console.error('Error loading more transactions:', error)
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

	// Group transactions based on groupBy prop
	let groupedTransactions: Record<string, Transaction[]> = {}
	
	if (groupBy === 'none') {
		groupedTransactions = { 'all': transactions }
	} else if (groupBy === 'user') {
		transactions.forEach(t => {
			const key = getUserName(t)
			if (!groupedTransactions[key]) groupedTransactions[key] = []
			groupedTransactions[key].push(t)
		})
	} else if (groupBy === 'category') {
		transactions.forEach(t => {
			const key = getCategoryName(t)
			if (!groupedTransactions[key]) groupedTransactions[key] = []
			groupedTransactions[key].push(t)
		})
	} else if (groupBy === 'date') {
		transactions.forEach(t => {
			const key = new Date(t.date).toLocaleDateString('en-US', {
				month: 'long',
				day: 'numeric',
				year: 'numeric'
			})
			if (!groupedTransactions[key]) groupedTransactions[key] = []
			groupedTransactions[key].push(t)
		})
	}

	// Sort group keys
	const sortedGroups = Object.keys(groupedTransactions).sort((a, b) => {
		if (groupBy === 'date') {
			return new Date(b).getTime() - new Date(a).getTime()
		}
		return a.localeCompare(b)
	})

	return (
		<>
			<div className="overflow-x-auto">
				{groupBy !== 'none' ? (
					<div className="space-y-4 p-4">
						{sortedGroups.map(groupKey => {
							const groupTransactions = groupedTransactions[groupKey]
							const isExpanded = expandedGroups.has(groupKey)
							const totalAmount = groupTransactions.reduce((sum, t) => 
								t.type === 'income' ? sum + t.amount : sum - t.amount, 0
							)
							const income = groupTransactions.filter(t => t.type === 'income')
								.reduce((sum, t) => sum + t.amount, 0)
							const expense = groupTransactions.filter(t => t.type === 'expense')
								.reduce((sum, t) => sum + t.amount, 0)
							
							return (
								<div key={groupKey} className="border border-[rgb(var(--border))] rounded-lg">
									<button
										onClick={() => toggleGroup(groupKey)}
										className="w-full p-4 flex items-center justify-between hover:bg-[rgb(var(--card-hover))] transition-colors"
									>
										<div className="flex items-center gap-3">
											{isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
											<div className="text-left">
												<h3 className="font-semibold">{groupKey}</h3>
												<p className="text-sm text-[rgb(var(--muted-foreground))]">
													{groupTransactions.length} transactions
												</p>
											</div>
										</div>
										<div className="flex items-center gap-4">
											<div className="text-right">
												<div className="flex items-center gap-2 text-green-500">
													<TrendingUp className="w-4 h-4" />
													<span className="font-medium">+{formatAmount(income, 'UZS')}</span>
												</div>
												<div className="flex items-center gap-2 text-red-500">
													<TrendingDown className="w-4 h-4" />
													<span className="font-medium">-{formatAmount(expense, 'UZS')}</span>
												</div>
											</div>
											<div className={`text-lg font-bold ${totalAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
												{formatAmount(Math.abs(totalAmount), 'UZS')}
											</div>
										</div>
									</button>
									
									{isExpanded && (
										<div className="border-t border-[rgb(var(--border))]">
											<table className="whoop-table">
												<thead>
													<tr>
														<th>Date</th>
														{groupBy !== 'user' && <th>User</th>}
														{groupBy !== 'category' && <th>Category</th>}
														<th>Description</th>
														<th>Type</th>
														<th>Amount</th>
														<th>Source</th>
													</tr>
												</thead>
												<tbody>
													{groupTransactions.map(t => (
														<tr key={t.id}>
															<td className="text-sm">{formatDate(t.date)}</td>
															{groupBy !== 'user' && <td>{getUserName(t)}</td>}
															{groupBy !== 'category' && <td>{getCategoryName(t)}</td>}
															<td>{t.title || t.description || '—'}</td>
															<td>
																<Badge variant={t.type === 'income' ? 'green' : 'red'}>
																	{t.type}
																</Badge>
															</td>
															<td className={t.type === 'income' ? 'text-green-500' : 'text-red-500'}>
																{t.type === 'income' ? '+' : '-'}{formatAmount(t.amount, t.currency || 'UZS')}
															</td>
															<td>{t.source || 'manual'}</td>
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
								<th>User</th>
								<th>Category</th>
								<th>Description</th>
								<th>Type</th>
								<th>Amount</th>
								<th>Source</th>
							</tr>
						</thead>
						<tbody>
							{transactions.length === 0 ? (
								<tr>
									<td colSpan={7} className="text-center py-8 text-[rgb(var(--muted-foreground))]">
										No transactions found
									</td>
								</tr>
							) : (
								transactions.map(t => (
									<tr key={t.id}>
										<td className="text-sm">{formatDate(t.date)}</td>
										<td>{getUserName(t)}</td>
										<td>{getCategoryName(t)}</td>
										<td>{t.title || t.description || '—'}</td>
										<td>
											<Badge variant={t.type === 'income' ? 'green' : 'red'}>
												{t.type}
											</Badge>
										</td>
										<td className={t.type === 'income' ? 'text-green-500' : 'text-red-500'}>
											{t.type === 'income' ? '+' : '-'}{formatAmount(t.amount, t.currency || 'UZS')}
										</td>
										<td>{t.source || 'manual'}</td>
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
						{loading ? 'Loading...' : 'Load More Transactions'}
					</Button>
				</div>
			)}
		</>
	)
}