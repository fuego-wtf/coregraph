import { Redis } from 'ioredis'
import { nanoid } from 'nanoid'

interface Session {
	id: string
	userId: string
	createdAt: number
	expiresAt: number
	data?: Record<string, any>
}

export class SessionManager {
	private readonly redis: Redis
	private readonly prefix: string
	private readonly ttl: number // session TTL in seconds

	constructor(redis: Redis, options: { prefix?: string; ttl?: number } = {}) {
		this.redis = redis
		this.prefix = options.prefix || 'session'
		this.ttl = options.ttl || 24 * 60 * 60 // 24 hours default
	}

	private getKey(sessionId: string): string {
		return `${this.prefix}:${sessionId}`
	}

	async create(userId: string, data?: Record<string, any>): Promise<Session> {
		const now = Math.floor(Date.now() / 1000)
		const session: Session = {
			id: nanoid(),
			userId,
			createdAt: now,
			expiresAt: now + this.ttl,
			data
		}

		await this.redis.set(
			this.getKey(session.id),
			JSON.stringify(session),
			'EX',
			this.ttl
		)

		return session
	}

	async get(sessionId: string): Promise<Session | null> {
		const data = await this.redis.get(this.getKey(sessionId))
		if (!data) return null

		const session = JSON.parse(data) as Session
		if (session.expiresAt < Math.floor(Date.now() / 1000)) {
			await this.destroy(sessionId)
			return null
		}

		return session
	}

	async extend(sessionId: string): Promise<boolean> {
		const session = await this.get(sessionId)
		if (!session) return false

		session.expiresAt = Math.floor(Date.now() / 1000) + this.ttl
		await this.redis.set(
			this.getKey(sessionId),
			JSON.stringify(session),
			'EX',
			this.ttl
		)

		return true
	}

	async destroy(sessionId: string): Promise<void> {
		await this.redis.del(this.getKey(sessionId))
	}

	async getUserSessions(userId: string): Promise<Session[]> {
		const keys = await this.redis.keys(`${this.prefix}:*`)
		const sessions: Session[] = []

		for (const key of keys) {
			const data = await this.redis.get(key)
			if (data) {
				const session = JSON.parse(data) as Session
				if (session.userId === userId && session.expiresAt > Math.floor(Date.now() / 1000)) {
					sessions.push(session)
				}
			}
		}

		return sessions
	}
}