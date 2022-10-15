import { rm } from 'node:fs/promises';
import { appConfig } from '../../config/app';
import type { MemoryStorage } from '../../types/storage';

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
