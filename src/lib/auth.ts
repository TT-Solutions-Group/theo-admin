import { NextRequest } from 'next/server'
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

export const COOKIE_NAME = 'admin_session'

function getJwtSecret(): Uint8Array {
	const secret = process.env.ADMIN_JWT_SECRET
	if (!secret) throw new Error('ADMIN_JWT_SECRET is not set')
	return new TextEncoder().encode(secret)
}

export async function createSessionToken(payload: JWTPayload & { sub: string }) {
	const token = await new SignJWT(payload)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('12h')
		.sign(getJwtSecret())
	return token
}

export async function verifySessionToken(token: string) {
	const { payload } = await jwtVerify<JWTPayload>(token, getJwtSecret())
	return payload
}

export async function requireAdmin(request: NextRequest) {
	const cookie = request.cookies.get(COOKIE_NAME)?.value
	if (!cookie) return false
	try {
		await verifySessionToken(cookie)
		return true
	} catch {
		return false
	}
}
