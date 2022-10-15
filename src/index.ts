import { config } from 'dotenv';
import { getImporters } from './config/icon-sets';
import { iconSetsStorage } from './data/icon-set/store/storage';
import { setImporters, updateIconSets } from './data/icon-sets';
import { loaded } from './data/loading';
import { cleanupStorageCache } from './data/storage/startup';
import { startHTTPServer } from './http';
import { loadEnvConfig } from './misc/load-config';

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
