import { jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'admin_session'

async function isValid(token: string) {
	const secret = process.env.ADMIN_JWT_SECRET
	if (!secret) return false
	try {
		await jwtVerify(token, new TextEncoder().encode(secret))
		return true
	} catch {
		return false
	}
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl
	const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/')
	const isAdminApi = pathname.startsWith('/api/admin/') && !pathname.startsWith('/api/admin/login')
	if (isAdminPath || isAdminApi) {
		// In production, enforce admin panel enable flag
		if (process.env.NODE_ENV === 'production' && process.env.ADMIN_PANEL_ENABLED !== 'true') {
			return NextResponse.redirect(new URL('/', request.url))
		}
		const token = request.cookies.get(COOKIE_NAME)?.value
		if (!token || !(await isValid(token))) {
			const url = new URL('/login', request.url)
			url.searchParams.set('next', pathname)
			return NextResponse.redirect(url)
		}
	}
	return NextResponse.next()
}

export const config = {
	matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
}
