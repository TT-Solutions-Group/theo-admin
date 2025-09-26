'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface TransactionsDateRangePickerProps {
	startDate: string
	endDate: string
}

export function TransactionsDateRangePicker({ startDate, endDate }: TransactionsDateRangePickerProps) {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [start, setStart] = useState(startDate)
	const [end, setEnd] = useState(endDate)

	useEffect(() => {
		setStart(startDate)
		setEnd(endDate)
	}, [startDate, endDate])

	const invalidRange = useMemo(() => {
		if (!start || !end) return false
		return new Date(start) > new Date(end)
	}, [start, end])

	const navigateWithParams = (params: URLSearchParams) => {
		const query = params.toString()
		router.push(`/admin/transactions${query ? `?${query}` : ''}`)
	}

	const handleApply = () => {
		const params = new URLSearchParams(searchParams?.toString() ?? '')
		if (start) {
			params.set('startDate', start)
		} else {
			params.delete('startDate')
		}
		if (end) {
			params.set('endDate', end)
		} else {
			params.delete('endDate')
		}
		navigateWithParams(params)
	}

	const handleReset = () => {
		const params = new URLSearchParams(searchParams?.toString() ?? '')
		params.delete('startDate')
		params.delete('endDate')
		navigateWithParams(params)
	}

	return (
		<div className="flex flex-col sm:flex-row gap-3 sm:items-end">
			<div className="flex flex-col">
				<label className="text-xs font-medium text-[rgb(var(--muted-foreground))]">Start date</label>
				<input
					type="date"
					value={start}
					onChange={(event) => setStart(event.target.value)}
					className="bg-[rgb(var(--card-elevated))] border border-[rgb(var(--border))] rounded-md px-3 py-2 text-sm"
				/>
			</div>
			<div className="flex flex-col">
				<label className="text-xs font-medium text-[rgb(var(--muted-foreground))]">End date</label>
				<input
					type="date"
					value={end}
					onChange={(event) => setEnd(event.target.value)}
					className="bg-[rgb(var(--card-elevated))] border border-[rgb(var(--border))] rounded-md px-3 py-2 text-sm"
				/>
			</div>
			<div className="flex gap-2">
				<Button size="sm" onClick={handleApply} disabled={!start || !end || invalidRange}>
					Apply
				</Button>
				<Button size="sm" variant="secondary" onClick={handleReset}>
					Reset
				</Button>
			</div>
			{invalidRange && (
				<p className="text-xs text-red-500">Start date must be before end date.</p>
			)}
		</div>
	)
}
