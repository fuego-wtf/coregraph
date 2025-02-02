import { createApp } from './app'

const start = async () => {
	try {
		const app = await createApp()
		
		const port = parseInt(process.env.PORT || '3000')
		const host = process.env.HOST || '0.0.0.0'

		await app.listen({ port, host })
		
		console.log(`Server listening on ${host}:${port}`)
	} catch (err) {
		console.error('Error starting server:', err)
		process.exit(1)
	}
}

start()