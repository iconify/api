import { readFile, readFileSync } from 'node:fs';
import type { MemoryStorage, MemoryStorageItem } from '../../types/storage.js';
import { runStorageCallbacks } from './callbacks.js';
import { addStorageToCleanup } from './cleanup.js';

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
	let failed = (error: unknown) => {
		console.error(error);
		runStorageCallbacks(storedItem, true);
	};
	let loaded = (dataStr: string) => {
		// Loaded
		storedItem.data = JSON.parse(dataStr) as T;
		runStorageCallbacks(storedItem);

		// Add to cleanup queue
		addStorageToCleanup(storage, storedItem);
	};

	if (storage.config.asyncRead) {
		// Load asynchronously
		pendingReads.add(storedItem);
		readFile(config.filename, 'utf8', (err, dataStr) => {
			pendingReads.delete(storedItem);

			if (err) {
				// Failed
				failed(err);
				return;
			}

			// Loaded
			loaded(dataStr);
		});
	} else {
		// Load synchronously
		let dataStr: string;
		try {
			dataStr = readFileSync(config.filename, 'utf8');
		} catch (err) {
			// Failed
			failed(err);
			return;
		}
		loaded(dataStr);
	}
}
