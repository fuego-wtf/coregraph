import { Redis } from 'ioredis'

interface RateLimitConfig {
	points: number      // Number of requests allowed
	duration: number    // Time window in seconds
	blockDuration?: number // Optional blocking time after limit exceeded
}

export class RateLimiter {
	private readonly redis: Redis
	private readonly prefix: string

	constructor(redis: Redis, prefix: string = 'ratelimit') {
		this.redis = redis
		this.prefix = prefix
	}

	async consume(key: string, config: RateLimitConfig): Promise<boolean> {
		const { points, duration, blockDuration } = config
		const now = Math.floor(Date.now() / 1000)
		const clearAt = now + duration
		const key_prefix = `${this.prefix}:${key}`

		// Check if key is blocked
		const isBlocked = await this.redis.get(`${key_prefix}:blocked`)
		if (isBlocked) {
			return false
		}

		// Get current points
		const current = await this.redis.get(key_prefix)
		if (!current) {
			await this.redis.multi()
				.set(key_prefix, points - 1)
				.expireat(key_prefix, clearAt)
				.exec()
			return true
		}

		const remaining = parseInt(current)
		if (remaining <= 0) {
			if (blockDuration) {
				await this.redis.set(`${key_prefix}:blocked`, '1', 'EX', blockDuration)
			}
			return false
		}

		await this.redis.decrby(key_prefix, 1)
		return true
	}

	async getRemainingPoints(key: string): Promise<number> {
		const current = await this.redis.get(`${this.prefix}:${key}`)
		return current ? parseInt(current) : 0
	}

	async isBlocked(key: string): Promise<boolean> {
		const blocked = await this.redis.get(`${this.prefix}:${key}:blocked`)
		return !!blocked
	}

	async reset(key: string): Promise<void> {
		const key_prefix = `${this.prefix}:${key}`
		await this.redis.del(key_prefix, `${key_prefix}:blocked`)
	}
}