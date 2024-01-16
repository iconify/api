import { writeFile, mkdir } from 'node:fs';
import { dirname } from 'node:path';
import type { MemoryStorage, MemoryStorageItem } from '../../types/storage.js';
import { addStorageToCleanup } from './cleanup.js';

const createdDirs: Set<string> = new Set();

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

	// Create directory if needed, write file
	const filename = config.filename;
	const dir = dirname(filename);

	const write = () => {
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
	};

	if (createdDirs.has(dir)) {
		write();
	} else {
		mkdir(
			dir,
			{
				recursive: true,
			},
			() => {
				createdDirs.add(dir);
				write();
			}
		);
	}
}
