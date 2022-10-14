import { readFile } from 'node:fs';
import type { MemoryStorage, MemoryStorageItem } from '../../types/storage';
import { runStorageCallbacks } from './callbacks';
import { addStorageToCleanup } from './cleanup';

/**
 * Load data
 */
export function loadStoredItem<T>(storage: MemoryStorage<T>, storedItem: MemoryStorageItem<T>) {
	const pendingReads = storage.pendingReads;
	if (storedItem.data || pendingReads.has(storedItem)) {
		// Already loaded or loading
		return;
	}

	const config = storedItem.cache;
	if (!config?.exists) {
		// Cannot load
		return;
	}

	// Load file
	pendingReads.add(storedItem);
	readFile(config.filename, 'utf8', (err, dataStr) => {
		pendingReads.delete(storedItem);

		if (err) {
			// Failed
			console.error(err);
			runStorageCallbacks(storedItem, true);
			return;
		}

		// Loaded
		storedItem.data = JSON.parse(dataStr) as T;
		runStorageCallbacks(storedItem);

		// Add to cleanup queue
		addStorageToCleanup(storage, storedItem);
	});
}
