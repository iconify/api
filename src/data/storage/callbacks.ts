import type { MemoryStorageItem, MemoryStorageCallback } from '../../types/storage.js';

/**
 * Run all callbacks from storage
 */
export function runStorageCallbacks<T>(storedItem: MemoryStorageItem<T>, force = false) {
	// Get data
	const data = storedItem.data;
	if (!data && !force) {
		return;
	}

	// Update time
	storedItem.lastUsed = Date.now();

	// Run all callbacks
	let callback: MemoryStorageCallback<T> | undefined;
	while ((callback = storedItem.callbacks.shift())) {
		callback(data || null);
	}
}
