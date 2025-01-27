const { spawn } = require('child_process');
const path = require('path');

function startService(name, script) {
	const proc = spawn('node', [script], {
		stdio: 'inherit',
		env: { ...process.env }
	});

	proc.on('error', (err) => {
		console.error(`Failed to start ${name}:`, err);
	});

	return proc;
}

// Start API server
startService('API Server', path.join(__dirname, '../src/server/api.js'));

// Start Chunk Processor
startService('Chunk Processor', path.join(__dirname, '../src/workers/ChunkProcessor.js'));