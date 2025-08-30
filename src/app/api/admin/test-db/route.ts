import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
	// Check admin auth
	const isAdmin = await requireAdmin(request)
	if (!isAdmin) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const supabase = getSupabaseAdmin()
		
		// Test query to users table
		const { data: users, error: usersError } = await supabase
			.from('users')
			.select('*')
			.limit(1)
		
		// Test query to payment_history table
		const { data: payments, error: paymentsError } = await supabase
			.from('payment_history')
			.select('*')
			.limit(1)
		
		// Test query to transactions table
		const { data: transactions, error: transactionsError } = await supabase
			.from('transactions')
			.select('*')
			.limit(1)
		
		// Test query to user_subscriptions table
		const { data: subscriptions, error: subscriptionsError } = await supabase
			.from('user_subscriptions')
			.select('*')
			.limit(1)
		
		return NextResponse.json({
			success: true,
			tables: {
				users: {
					success: !usersError,
					error: usersError?.message,
					hasData: !!users && users.length > 0,
					sample: users?.[0]
				},
				payment_history: {
					success: !paymentsError,
					error: paymentsError?.message,
					hasData: !!payments && payments.length > 0,
					sample: payments?.[0]
				},
				transactions: {
					success: !transactionsError,
					error: transactionsError?.message,
					hasData: !!transactions && transactions.length > 0,
					sample: transactions?.[0]
				},
				user_subscriptions: {
					success: !subscriptionsError,
					error: subscriptionsError?.message,
					hasData: !!subscriptions && subscriptions.length > 0,
					sample: subscriptions?.[0]
				}
			}
		})
	} catch (error) {
		return NextResponse.json({ 
			success: false, 
			error: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 })
	}
}