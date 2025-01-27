import { AgenticClient } from '../src/sdk/AgenticClient';

async function main() {
  // Initialize client
  const client = new AgenticClient({
    endpoint: 'https://api.graphyn.xyz/v1',
    chunkSize: 2 * 1024 * 1024 // 2MB chunks
  });

  await client.init();

  // Example data
  const data = {
    nodes: {
      'user123': { name: 'Alice', role: 'admin' },
      'doc456': { title: 'Project Plan', content: '...' }
    },
    edges: [
      { from: 'user123', to: 'doc456', type: 'OWNS' }
    ]
  };

  // Upload with progress tracking
  client.on('progress', (progress) => {
    console.log(`Upload progress: ${progress}%`);
  });

  const result = await client.uploadData(data);
  console.log('Upload complete:', result);
}

main().catch(console.error); 