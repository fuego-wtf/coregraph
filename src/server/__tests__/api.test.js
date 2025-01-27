const { build } = require('../api');

describe('Agent CRUD Operations', () => {
	let app;

	beforeEach(async () => {
		app = await build();
	});

	afterEach(async () => {
		await app.close();
	});

	describe('GET /agents', () => {
		it('should return empty array when no agents exist', async () => {
			const response = await app.inject({
				method: 'GET',
				url: '/agents'
			});
			
			expect(response.statusCode).toBe(200);
			expect(JSON.parse(response.payload)).toEqual([]);
		});
	});

	describe('POST /agents', () => {
		it('should create a new agent', async () => {
			const agentData = {
				name: 'Test Agent',
				description: 'Test Description'
			};

			const response = await app.inject({
				method: 'POST',
				url: '/agents',
				payload: agentData
			});

			expect(response.statusCode).toBe(200);
			const agent = JSON.parse(response.payload);
			expect(agent.name).toBe(agentData.name);
			expect(agent.description).toBe(agentData.description);
			expect(agent.id).toBeDefined();
			expect(agent.createdAt).toBeDefined();
		});
	});

	describe('GET /agents/:agentId', () => {
		it('should return 404 for non-existent agent', async () => {
			const response = await app.inject({
				method: 'GET',
				url: '/agents/non-existent-id'
			});

			expect(response.statusCode).toBe(404);
		});

		it('should return agent if exists', async () => {
			// Create an agent first
			const createResponse = await app.inject({
				method: 'POST',
				url: '/agents',
				payload: { name: 'Test Agent' }
			});
			const agent = JSON.parse(createResponse.payload);

			// Get the created agent
			const getResponse = await app.inject({
				method: 'GET',
				url: `/agents/${agent.id}`
			});

			expect(getResponse.statusCode).toBe(200);
			expect(JSON.parse(getResponse.payload)).toEqual(agent);
		});
	});

	describe('DELETE /agents/:agentId', () => {
		it('should return 404 for non-existent agent', async () => {
			const response = await app.inject({
				method: 'DELETE',
				url: '/agents/non-existent-id'
			});

			expect(response.statusCode).toBe(404);
		});

		it('should delete existing agent', async () => {
			// Create an agent first
			const createResponse = await app.inject({
				method: 'POST',
				url: '/agents',
				payload: { name: 'Test Agent' }
			});
			const agent = JSON.parse(createResponse.payload);

			// Delete the agent
			const deleteResponse = await app.inject({
				method: 'DELETE',
				url: `/agents/${agent.id}`
			});

			expect(deleteResponse.statusCode).toBe(204);

			// Verify agent is deleted
			const getResponse = await app.inject({
				method: 'GET',
				url: `/agents/${agent.id}`
			});

			expect(getResponse.statusCode).toBe(404);
		});
	});
});