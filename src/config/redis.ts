import Redis from 'ioredis'

interface RedisConfig {
	host?: string
	port?: number
	password?: string
	tls?: boolean
}

export class RedisService {
	private static instance: Redis
	
	static initialize(config: RedisConfig = {}) {
		const {
			host = process.env.REDIS_HOST || 'localhost',
			port = parseInt(process.env.REDIS_PORT || '6379'),
			password = process.env.REDIS_PASSWORD,
			tls = process.env.REDIS_TLS === 'true'
		} = config

		this.instance = new Redis({
			host,
			port,
			password,
			tls: tls ? {} : undefined,
			retryStrategy(times) {
				const delay = Math.min(times * 50, 2000)
				return delay
			},
			maxRetriesPerRequest: 3
		})

		this.instance.on('error', (error) => {
			console.error('[REDIS_ERROR]', error)
		})

		this.instance.on('connect', () => {
			console.info('[REDIS_CONNECTED]')
		})

		return this.instance
	}

	static getInstance(): Redis {
		if (!this.instance) {
			throw new Error('Redis not initialized')
		}
		return this.instance
	}
}