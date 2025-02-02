import { FastifyRequest, FastifyReply } from 'fastify'
import { JWTService } from '../auth/jwt'
import { SessionManager } from '../auth/session'
import { RateLimiter } from '../rate-limiter'

interface AuthOptions {
	jwtService: JWTService
	sessionManager: SessionManager
	rateLimiter: RateLimiter
}

export class AuthMiddleware {
	private readonly jwtService: JWTService
	private readonly sessionManager: SessionManager
	private readonly rateLimiter: RateLimiter

	constructor(options: AuthOptions) {
		this.jwtService = options.jwtService
		this.sessionManager = options.sessionManager
		this.rateLimiter = options.rateLimiter
	}

	authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			// Check rate limiting
			const allowed = await this.rateLimiter.consume(request.ip, {
				points: 100,
				duration: 60 * 15 // 15 minutes
			})

			if (!allowed) {
				return reply.status(429).send({ error: 'Too many requests' })
			}

			// Get token from header
			const authHeader = request.headers.authorization
			if (!authHeader?.startsWith('Bearer ')) {
				return reply.status(401).send({ error: 'No token provided' })
			}

			const token = authHeader.split(' ')[1]

			// Verify token
			const payload = await this.jwtService.verifyToken(token)
			
			// Check if token is blacklisted
			const isBlacklisted = await this.jwtService.isBlacklisted(token)
			if (isBlacklisted) {
				return reply.status(401).send({ error: 'Token is invalid' })
			}

			// Get session
			const session = await this.sessionManager.get(payload.jti)
			if (!session) {
				return reply.status(401).send({ error: 'Session expired' })
			}

			// Extend session
			await this.sessionManager.extend(payload.jti)

			// Add user and session to request
			request.user = { id: payload.sub }
			request.session = session

			return
		} catch (error) {
			console.error('[AUTH_MIDDLEWARE]', error)
			return reply.status(401).send({ error: 'Authentication failed' })
		}
	}

	// Optional middleware for routes that can work with or without auth
	optional = async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			await this.authenticate(request, reply)
		} catch (error) {
			// Continue without authentication
			console.debug('[AUTH_MIDDLEWARE] Optional auth failed')
		}
	}
}

// Type augmentation for Fastify
declare module 'fastify' {
	interface FastifyRequest {
		user?: {
			id: string
		}
		session?: {
			id: string
			data?: Record<string, any>
		}
	}
}