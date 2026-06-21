import { createServer } from 'node:http';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createPool } from './db.js';
import { ChatService } from './services/chatService.js';
import { DocumentService } from './services/documentService.js';
import { InferenceService } from './services/inferenceService.js';
import { Repository } from './services/repository.js';
import { SpacesService } from './services/spacesService.js';

const config = loadConfig();
const pool = createPool(config);
const repository = new Repository(pool);
const inference = new InferenceService(config.inference);
const spaces = new SpacesService(config.spaces);
const documents = new DocumentService(config, repository, spaces, inference);
const chat = new ChatService(config, repository, inference);
const server = createServer(createApp({ config, repository, documents, chat }));

server.listen(config.port, () => console.log(JSON.stringify({ level: 'info', message: 'API listening', port: config.port })));

async function shutdown(signal: string) {
  console.log(JSON.stringify({ level: 'info', message: 'Shutting down', signal }));
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

