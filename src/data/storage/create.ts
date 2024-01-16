import { appConfig } from '../../config/app.js';
import type { MemoryStorage, MemoryStorageConfig, MemoryStorageItem } from '../../types/storage.js';
import { cleanupStoredItem } from './cleanup.js';
import { writeStoredItem } from './write.js';

/**
 * Create storage
 */
export function createStorage<T>(config: MemoryStorageConfig): MemoryStorage<T> {
	return {
		config,
		watched: new Set(),
		pendingReads: new Set(),
		pendingWrites: new Set(),
	};
}

/**
 * Create item to store
 */
export function createStoredItem<T>(
	storage: MemoryStorage<T>,
	data: T,
	cacheFile: string,
	autoCleanup = true,
	done?: (storedItem: MemoryStorageItem<T>, err?: NodeJS.ErrnoException) => void
): MemoryStorageItem<T> {
	const filename = storage.config.cacheDir.replace('{cache}', appConfig.cacheRootDir) + '/' + cacheFile;
	const storedItem: MemoryStorageItem<T> = {
		cache: {
			filename,
			exists: false,
		},
		data,
		callbacks: [],
		lastUsed: autoCleanup ? 0 : Date.now(),
	};

	// Save cache if cleanup is enabled
	const storageConfig = storage.config;
	if (storageConfig.maxCount || storageConfig.cleanupAfter) {
		writeStoredItem(storage, storedItem, (err) => {
			if (autoCleanup && !err) {
				// Remove item if not used and not failed
				if (!storedItem.lastUsed) {
					cleanupStoredItem(storage, storedItem);
				}
			}

			done?.(storedItem, err);
		});
	} else {
		done?.(storedItem);
	}

	return storedItem;
}
