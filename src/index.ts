import { config } from 'dotenv';
import { getImporters } from './config/icon-sets';
import { setImporters, updateIconSets } from './data/icon-sets';
import { loaded } from './data/loading';
import { startHTTPServer } from './http';
import { loadEnvConfig } from './misc/load-config';

(async () => {
	// Configure environment
	config();
	loadEnvConfig();

	// Start HTTP server
	startHTTPServer();

	// Get all importers and load data
	const importers = await getImporters();
	for (let i = 0; i < importers.length; i++) {
		await importers[i].init();
	}
	setImporters(importers);
	updateIconSets();

	// Loaded
	loaded();
})()
	.then(() => {
		console.log('API startup process complete');
	})
	.catch(console.error);
