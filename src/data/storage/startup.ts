import { rm } from 'node:fs/promises';
import { appConfig } from '../../config/app.js';
import type { MemoryStorage } from '../../types/storage.js';

/**
 * Remove old cache
 */
export async function cleanupStorageCache<T>(storage: MemoryStorage<T>) {
	const dir = storage.config.cacheDir.replace('{cache}', appConfig.cacheRootDir);
	try {
		await rm(dir, {
			recursive: true,
		});
	} catch {
		//
	}
}
