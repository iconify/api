import type { MemoryStorageItem, MemoryStorageCallback, MemoryStorage } from '../../types/storage.js';
import { loadStoredItem } from './load.js';

/**
 * Get storage data when ready
 */
export function getStoredItem<T>(
	storage: MemoryStorage<T>,
	storedItem: MemoryStorageItem<T>,
	callback: MemoryStorageCallback<T>
) {
	if (storedItem.data) {
		// Data is already available: run callback
		storedItem.lastUsed = Date.now();
		callback(storedItem.data);
		return;
	}

	// Add callback to queue
	storedItem.callbacks.push(callback);

	// Load storage
	loadStoredItem(storage, storedItem);
}
