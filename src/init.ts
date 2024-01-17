import { getImporters } from './config/icon-sets.js';
import { iconSetsStorage } from './data/icon-set/store/storage.js';
import { setImporters, updateIconSets } from './data/icon-sets.js';
import { cleanupStorageCache } from './data/storage/startup.js';

/**
 * Init API
 */
export async function initAPI() {
	// Reset old cache
	await cleanupStorageCache(iconSetsStorage);

	// Get all importers and load data
	const importers = await getImporters();
	for (let i = 0; i < importers.length; i++) {
		await importers[i].init();
	}
	setImporters(importers);
	updateIconSets();
}
