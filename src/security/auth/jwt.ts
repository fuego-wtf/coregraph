import { SignJWT, jwtVerify } from 'jose'
import { nanoid } from 'nanoid'
import { Redis } from 'ioredis'

interface JWTPayload {
	jti: string
	sub: string
	iat: number
	exp: number
	type: 'access' | 'refresh'
}

export class JWTService {
	private readonly secret: Uint8Array
	private readonly redis: Redis

	constructor(secret: string, redis: Redis) {
		this.secret = new TextEncoder().encode(secret)
		this.redis = redis
	}

	async generateToken(userId: string, type: 'access' | 'refresh' = 'access'): Promise<string> {
		const iat = Math.floor(Date.now() / 1000)
		const exp = iat + (type === 'access' ? 15 * 60 : 7 * 24 * 60 * 60) // 15 mins or 7 days

		const token = await new SignJWT({ type })
			.setProtectedHeader({ alg: 'HS256' })
			.setJti(nanoid())
			.setIssuedAt(iat)
			.setExpirationTime(exp)
			.setSubject(userId)
			.sign(this.secret)

		if (type === 'refresh') {
			await this.redis.set(`refresh:${token}`, userId, 'EX', 7 * 24 * 60 * 60)
		}

		return token
	}

	async verifyToken(token: string): Promise<JWTPayload> {
		const { payload } = await jwtVerify(token, this.secret)
		
		if (payload.type === 'refresh') {
			const userId = await this.redis.get(`refresh:${token}`)
			if (!userId) {
				throw new Error('Invalid refresh token')
			}
		}

		return payload as JWTPayload
	}

	async blacklistToken(token: string): Promise<void> {
		const { payload } = await jwtVerify(token, this.secret)
		const exp = payload.exp - Math.floor(Date.now() / 1000)
		
		await this.redis.set(`blacklist:${token}`, '1', 'EX', exp)
	}

	async isBlacklisted(token: string): Promise<boolean> {
		const exists = await this.redis.exists(`blacklist:${token}`)
		return exists === 1
	}
}