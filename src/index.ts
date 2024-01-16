import { config } from 'dotenv';
import { getImporters } from './config/icon-sets.js';
import { iconSetsStorage } from './data/icon-set/store/storage.js';
import { setImporters, updateIconSets } from './data/icon-sets.js';
import { loaded } from './data/loading.js';
import { cleanupStorageCache } from './data/storage/startup.js';
import { startHTTPServer } from './http/index.js';
import { loadEnvConfig } from './misc/load-config.js';

(async () => {
	// Configure environment
	config();
	loadEnvConfig();

	// Reset old cache
	await cleanupStorageCache(iconSetsStorage);

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
