import type { MemoryStorage, MemoryStorageItem } from '../../types/storage';
import { runStorageCallbacks } from './callbacks';
import { writeStoredItem } from './write';

/**
 * Stop timer
 */
function stopTimer<T>(storage: MemoryStorage<T>) {
	if (storage.timer) {
		clearInterval(storage.timer);
		delete storage.timer;
	}
}

/**
 * Clean up stored item
 */
export function cleanupStoredItem<T>(storage: MemoryStorage<T>, storedItem: MemoryStorageItem<T>): boolean {
	if (!storedItem.cache?.exists) {
		// Cannot be cleaned up
		return false;
	}

	if (storedItem.callbacks.length) {
		// Callbacks exist ???
		if (storedItem.data) {
			runStorageCallbacks(storedItem);
			return false;
		}
		return true;
	}

	// Cache stored: clean up
	delete storedItem.data;
	storage.watched.delete(storedItem);
	if (!storage.watched.size) {
		stopTimer(storage);
	}

	// Purge unused memory if garbage collector global is exposed
	try {
		global.gc?.();
	} catch {}

	return true;
}

/**
 * Clean up stored items
 */
export function cleanupStorage<T>(storage: MemoryStorage<T>) {
	const config = storage.config;
	const watched = storage.watched;

	// Items with laseUsed > lastUsedLimit cannot be cleaned up
	// If not set, allow items to be stored for at least 10 seconds
	const lastUsedLimit = Date.now() - (config.minExpiration || 10000);

	// Check timer limit
	const cleanupAfter = config.cleanupAfter;
	if (cleanupAfter) {
		const minTimer = Math.min(Date.now() - cleanupAfter, lastUsedLimit);
		watched.forEach((item) => {
			if (item.lastUsed < minTimer) {
				cleanupStoredItem(storage, item);
			}
		});
	}

	// Check items limit
	const maxCount = config.maxCount;
	if (maxCount && watched.size > maxCount) {
		// Sort items
		const sortedList = Array.from(watched).sort((item1, item2) => item1.lastUsed - item2.lastUsed);

		// Delete items, sorted by `lastUsed`
		for (let i = 0; i < sortedList.length && watched.size > maxCount; i++) {
			// Attempt to remove item
			const item = sortedList[i];
			if (item.lastUsed < lastUsedLimit) {
				cleanupStoredItem(storage, item);
			}
		}
	}
}

/**
 * Add storage to cleanup queue
 *
 * Should be called after writeStoredItem() or loadStoredItem()
 */
export function addStorageToCleanup<T>(storage: MemoryStorage<T>, storedItem: MemoryStorageItem<T>) {
	if (!storedItem.data) {
		// Nothing to watch
		return;
	}

	const config = storage.config;
	const watched = storage.watched;

	watched.add(storedItem);

	// Set timer
	if (!storage.timer) {
		const timerDuration = config.timer;
		const cleanupAfter = config.cleanupAfter;
		if (timerDuration && cleanupAfter) {
			storage.timer = setInterval(() => {
				// Callback for debugging
				config.timerCallback?.();

				// Run cleanup
				cleanupStorage(storage);
			}, timerDuration);
		}
	}

	// Clean up items immediately if there are too many
	if (config.maxCount && watched.size >= config.maxCount) {
		cleanupStorage(storage);
	}
}
