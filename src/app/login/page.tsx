"use client"

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, LogIn } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

function LoginFormInner() {
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const router = useRouter()
	const qp = useSearchParams()
	const next = qp.get('next') || '/admin'

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		setLoading(true)
		try {
			const res = await fetch('/api/admin/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password }),
			})
			const data = await res.json()
			if (!res.ok || !data.ok) {
				setError(data.error || 'Invalid password')
			} else {
				router.replace(next)
			}
		} catch {
			setError('Network error. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-6 bg-[rgb(var(--background))]">
			<div className="w-full max-w-md">
				{/* Logo Section */}
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgb(var(--whoop-green))/0.2] mb-4">
						<Lock className="w-8 h-8 text-[rgb(var(--whoop-green))]" />
					</div>
					<h1 className="text-3xl font-bold text-[rgb(var(--foreground))]">
						{process.env.NEXT_PUBLIC_APP_NAME || 'Teodor Admin'}
					</h1>
					<p className="text-[rgb(var(--muted-foreground))] mt-2">
						Sign in to access the admin dashboard
					</p>
				</div>

				{/* Login Card */}
				<Card elevated>
					<CardHeader>
						<CardTitle>Admin Login</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={onSubmit} className="space-y-4">
							<Input
								type="password"
								label="Password"
								placeholder="Enter admin password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								error={error || undefined}
								required
								autoFocus
							/>
							
							<Button
								type="submit"
								variant="primary"
								size="md"
								loading={loading}
								className="w-full"
							>
								{!loading && <LogIn className="w-4 h-4" />}
								{loading ? 'Signing in...' : 'Sign In'}
							</Button>
						</form>
					</CardContent>
				</Card>

				{/* Footer */}
				<p className="text-center text-sm text-[rgb(var(--muted-foreground))] mt-6">
					Protected area • Authorized personnel only
				</p>
			</div>
		</div>
	)
}

export default function LoginPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin h-8 w-8 border-2 border-[rgb(var(--whoop-green))] border-t-transparent rounded-full" />
			</div>
		}>
			<LoginFormInner />
		</Suspense>
	)
}