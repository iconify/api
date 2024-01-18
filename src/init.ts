import { getImporters } from './config/icon-sets.js';
import { iconSetsStorage } from './data/icon-set/store/storage.js';
import { setImporters, updateIconSets } from './data/icon-sets.js';
import { cleanupStorageCache } from './data/storage/startup.js';
import { Importer } from './types/importers.js';

interface InitOptions {
	// Cleanup storage cache
	cleanup?: boolean;

	// Importers
	importers?: Importer[];
}

/**
 * Init API
 */
export async function initAPI(options: InitOptions = {}) {
	// Reset old cache
	if (options.cleanup !== false) {
		await cleanupStorageCache(iconSetsStorage);
	}

	// Get all importers and load data
	let importers = options.importers;
	if (!importers) {
		importers = await getImporters();
	}
	for (let i = 0; i < importers.length; i++) {
		await importers[i].init();
	}

	// Update
	setImporters(importers);
	updateIconSets();
}
