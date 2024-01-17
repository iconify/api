import { config } from 'dotenv';
import { loaded } from './data/loading.js';
import { startHTTPServer } from './http/index.js';
import { loadEnvConfig } from './misc/load-config.js';
import { initAPI } from './init.js';

(async () => {
	// Configure environment
	config();
	loadEnvConfig();

	// Start HTTP server
	startHTTPServer();

	// Init API
	await initAPI();

	// Loaded
	loaded();
})()
	.then(() => {
		console.log('API startup process complete');
	})
	.catch(console.error);
