import { getUserById, updateUserById } from '@/lib/supabase-admin'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, User, Calendar, Globe, DollarSign, Crown, Save, XCircle, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default async function UserDetail({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ updated?: string; cancelled?: string }> }) {
	const resolvedParams = await params
	const resolvedSearchParams = await searchParams
	const id = Number(resolvedParams.id)
	if (!Number.isFinite(id)) notFound()

	const user = await getUserById(id).catch(() => null)
	if (!user) notFound()

	async function update(formData: FormData) {
		'use server'
		const updates = {
			first_name: String(formData.get('first_name') || ''),
			last_name: String(formData.get('last_name') || ''),
			username: String(formData.get('username') || ''),
			language: String(formData.get('language') || ''),
			default_currency: String(formData.get('default_currency') || ''),
			is_premium: formData.get('is_premium') === 'on',
		}
		await updateUserById(id, updates)
		redirect(`/admin/users/${id}?updated=1`)
	}

	async function cancelSubscription() {
		'use server'
		await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/users/${id}/subscription`, { method: 'DELETE' })
		redirect(`/admin/users/${id}?cancelled=1`)
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link href="/admin/users">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="w-4 h-4" />
							Back
						</Button>
					</Link>
					<div>
						<h1 className="text-3xl font-bold">User Details</h1>
						<p className="text-[rgb(var(--muted-foreground))] mt-1">
							Managing user #{user.id}
						</p>
					</div>
				</div>
				{user.is_premium && (
					<Badge variant="yellow" className="px-3 py-1">
						<Crown className="w-4 h-4 mr-1" />
						Premium User
					</Badge>
				)}
			</div>

			{/* Success Messages */}
			{resolvedSearchParams.updated && (
				<div className="flex items-center gap-2 p-4 rounded-[16px] bg-[rgb(var(--whoop-green))/0.1] text-[rgb(var(--whoop-green))]">
					<Check className="w-5 h-5" />
					<span>User profile updated successfully</span>
				</div>
			)}
			{resolvedSearchParams.cancelled && (
				<div className="flex items-center gap-2 p-4 rounded-[16px] bg-[rgb(var(--whoop-yellow))/0.1] text-[rgb(var(--whoop-yellow))]">
					<Check className="w-5 h-5" />
					<span>Subscription cancelled successfully</span>
				</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* User Information Card */}
				<Card elevated>
					<CardHeader>
						<CardTitle>User Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-4">
							<div className="w-16 h-16 rounded-full bg-[rgb(var(--whoop-green))/0.1] flex items-center justify-center">
								<User className="w-8 h-8 text-[rgb(var(--whoop-green))]" />
							</div>
							<div>
								<h3 className="text-xl font-semibold">
									{[user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'User'}
								</h3>
								{user.username && (
									<p className="text-[rgb(var(--muted-foreground))]">@{user.username}</p>
								)}
							</div>
						</div>

						<div className="space-y-3 pt-4 border-t border-[rgb(var(--border))]">
							<div className="flex items-center justify-between">
								<span className="text-[rgb(var(--muted-foreground))]">Telegram ID</span>
								<span className="font-mono">{user.telegram_id}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-[rgb(var(--muted-foreground))]">User ID</span>
								<span className="font-mono">#{user.id}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-[rgb(var(--muted-foreground))]">Joined</span>
								<span className="flex items-center gap-2">
									<Calendar className="w-4 h-4" />
									{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-[rgb(var(--muted-foreground))]">Status</span>
								{user.is_premium ? (
									<Badge variant="yellow">Premium</Badge>
								) : (
									<Badge variant="default">Free</Badge>
								)}
							</div>
						</div>

						{/* Subscription Actions */}
						{user.is_premium && (
							<div className="pt-4 border-t border-[rgb(var(--border))]">
								<form action={cancelSubscription}>
									<Button type="submit" variant="danger" size="md" className="w-full">
										<XCircle className="w-4 h-4" />
										Cancel Subscription
									</Button>
								</form>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Edit Profile Card */}
				<Card elevated>
					<CardHeader>
						<CardTitle>Edit Profile</CardTitle>
					</CardHeader>
					<CardContent>
						<form action={update} className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<Input
									name="first_name"
									label="First Name"
									defaultValue={user.first_name || ''}
									placeholder="John"
								/>
								<Input
									name="last_name"
									label="Last Name"
									defaultValue={user.last_name || ''}
									placeholder="Doe"
								/>
							</div>

							<Input
								name="username"
								label="Username"
								defaultValue={user.username || ''}
								placeholder="johndoe"
							/>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-[rgb(var(--secondary-foreground))] mb-2">
										<Globe className="w-4 h-4 inline mr-1" />
										Language
									</label>
									<input
										name="language"
										defaultValue={user.language || ''}
										placeholder="en"
										className="whoop-input"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-[rgb(var(--secondary-foreground))] mb-2">
										<DollarSign className="w-4 h-4 inline mr-1" />
										Currency
									</label>
									<input
										name="default_currency"
										defaultValue={user.default_currency || ''}
										placeholder="USD"
										className="whoop-input"
									/>
								</div>
							</div>

							<div className="flex items-center gap-3 p-4 rounded-[12px] bg-[rgb(var(--card))]">
								<input
									type="checkbox"
									name="is_premium"
									id="is_premium"
									defaultChecked={!!user.is_premium}
									className="w-5 h-5 rounded border-[rgb(var(--border))] text-[rgb(var(--whoop-green))] focus:ring-[rgb(var(--whoop-green))]"
								/>
								<label htmlFor="is_premium" className="flex items-center gap-2 cursor-pointer">
									<Crown className="w-5 h-5 text-[rgb(var(--whoop-yellow))]" />
									<span className="font-medium">Premium User</span>
								</label>
							</div>

							<Button type="submit" variant="primary" size="md" className="w-full">
								<Save className="w-4 h-4" />
								Save Changes
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}