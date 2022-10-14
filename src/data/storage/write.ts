import { writeFile, mkdir } from 'node:fs';
import { dirname } from 'node:path';
import type { MemoryStorage, MemoryStorageItem } from '../../types/storage';
import { addStorageToCleanup } from './cleanup';

/**
 * Write storage to file
 */
export function writeStoredItem<T>(
	storage: MemoryStorage<T>,
	storedItem: MemoryStorageItem<T>,
	done?: (err?: NodeJS.ErrnoException) => void
) {
	const pendingWrites = storage.pendingWrites;
	const data = storedItem.data;
	const config = storedItem.cache;
	if (!data || !config || pendingWrites.has(storedItem)) {
		// Missing content or disabled or already writing
		done?.();
		return;
	}

	// Serialise and store data
	const dataStr = JSON.stringify(data);
	pendingWrites.add(storedItem);

	// Create directory
	const filename = config.filename;
	const dir = dirname(filename);
	mkdir(
		dir,
		{
			recursive: true,
		},
		() => {
			// Write file
			writeFile(filename, dataStr, 'utf8', (err) => {
				pendingWrites.delete(storedItem);

				if (err) {
					// Error
					console.error(err);
				} else {
					// Success
					config.exists = true;

					// Data is written, storage can be cleaned up when needed
					addStorageToCleanup(storage, storedItem);
				}

				done?.(err || void 0);
			});
		}
	);
}
