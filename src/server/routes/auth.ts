import { FastifyInstance } from 'fastify'
import { JWTService } from '../../security/auth/jwt'
import { SessionManager } from '../../security/auth/session'
import { RateLimiter } from '../../security/rate-limiter'
import { z } from 'zod'

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8)
})

export async function authRoutes(
	fastify: FastifyInstance,
	options: {
		jwtService: JWTService
		sessionManager: SessionManager
		rateLimiter: RateLimiter
	}
) {
	const { jwtService, sessionManager, rateLimiter } = options

	fastify.post('/login', async (request, reply) => {
		try {
			// Rate limiting for login attempts
			const allowed = await rateLimiter.consume(request.ip, {
				points: 5,
				duration: 60 * 5, // 5 minutes
				blockDuration: 60 * 15 // 15 minutes block after limit exceeded
			})

			if (!allowed) {
				return reply.status(429).send({ error: 'Too many login attempts' })
			}

			const body = loginSchema.parse(request.body)

			// TODO: Implement actual user authentication
			const userId = 'test-user-id' // Replace with actual user authentication

			// Create session
			const session = await sessionManager.create(userId)

			// Generate tokens
			const [accessToken, refreshToken] = await Promise.all([
				jwtService.generateToken(userId, 'access'),
				jwtService.generateToken(userId, 'refresh')
			])

			return reply.send({
				accessToken,
				refreshToken,
				expiresIn: 900 // 15 minutes
			})
		} catch (error) {
			console.error('[AUTH_LOGIN]', error)
			if (error instanceof z.ZodError) {
				return reply.status(400).send({ error: 'Invalid input' })
			}
			return reply.status(500).send({ error: 'Internal server error' })
		}
	})

	fastify.post('/refresh', async (request, reply) => {
		try {
			const { refreshToken } = request.body as { refreshToken: string }
			if (!refreshToken) {
				return reply.status(400).send({ error: 'Refresh token required' })
			}

			const payload = await jwtService.verifyToken(refreshToken)
			if (payload.type !== 'refresh') {
				return reply.status(401).send({ error: 'Invalid token type' })
			}

			const accessToken = await jwtService.generateToken(payload.sub, 'access')
			
			return reply.send({
				accessToken,
				expiresIn: 900 // 15 minutes
			})
		} catch (error) {
			console.error('[AUTH_REFRESH]', error)
			return reply.status(401).send({ error: 'Invalid refresh token' })
		}
	})

	fastify.post('/logout', async (request, reply) => {
		try {
			const authHeader = request.headers.authorization
			if (!authHeader?.startsWith('Bearer ')) {
				return reply.status(401).send({ error: 'No token provided' })
			}

			const token = authHeader.split(' ')[1]
			await jwtService.blacklistToken(token)

			const refreshToken = request.headers['x-refresh-token']
			if (refreshToken) {
				await jwtService.blacklistToken(refreshToken as string)
			}

			return reply.status(204).send()
		} catch (error) {
			console.error('[AUTH_LOGOUT]', error)
			return reply.status(500).send({ error: 'Internal server error' })
		}
	})
}