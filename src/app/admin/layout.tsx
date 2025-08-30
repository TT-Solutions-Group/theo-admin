import { Sidebar } from '@/components/admin/sidebar'
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	// Server-side guard as an additional layer beyond middleware
	const cookieStore = await cookies()
	const token = cookieStore.get(COOKIE_NAME)?.value
	if (!token) {
		redirect('/login?next=/admin')
	}
	try {
		await verifySessionToken(token)
	} catch {
		redirect('/login?next=/admin')
	}

	return (
		<div className="min-h-screen flex bg-[rgb(var(--background))]">
			<Sidebar />
			<main className="flex-1 lg:ml-64 h-screen overflow-y-auto pt-16 lg:pt-0">
				<div className="p-6 lg:p-8">
					{children}
				</div>
			</main>
		</div>
	)
}