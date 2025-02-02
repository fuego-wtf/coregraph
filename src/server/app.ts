import fastify from 'fastify'
import { RedisService } from '../config/redis'
import { JWTService } from '../security/auth/jwt'
import { SessionManager } from '../security/auth/session'
import { RateLimiter } from '../security/rate-limiter'
import { AuthMiddleware } from '../security/middleware/auth'
import { authRoutes } from './routes/auth'

export async function createApp() {
	const app = fastify({
		logger: true
	})

	// Initialize Redis
	const redis = RedisService.initialize()

	// Initialize services
	const jwtService = new JWTService(
		process.env.JWT_SECRET || 'your-secret-key',
		redis
	)

	const sessionManager = new SessionManager(redis, {
		prefix: 'session',
		ttl: 24 * 60 * 60 // 24 hours
	})

	const rateLimiter = new RateLimiter(redis, 'ratelimit')

	// Initialize auth middleware
	const authMiddleware = new AuthMiddleware({
		jwtService,
		sessionManager,
		rateLimiter
	})

	// Register auth routes
	await app.register(authRoutes, {
		prefix: '/auth',
		jwtService,
		sessionManager,
		rateLimiter
	})

	// Add auth middleware hook
	app.addHook('onRequest', async (request, reply) => {
		const path = request.routerPath || request.url
		if (path.startsWith('/auth')) {
			return
		}
		return authMiddleware.authenticate(request, reply)
	})

	// Health check route
	app.get('/health', async () => {
		return { status: 'ok' }
	})

	return app
}