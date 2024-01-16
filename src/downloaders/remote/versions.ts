import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { appConfig } from '../../config/app.js';
import type {
	RemoteDownloaderType,
	RemoteDownloaderVersion,
	RemoteDownloaderVersionMixin,
} from '../../types/downloaders/remote.js';

// Storage
type StoredVersions = Record<string, RemoteDownloaderVersion>;

/**
 * Get cache file
 */
function getCacheFile(): string {
	return appConfig.cacheRootDir + '/versions.json';
}

/**
 * Get data
 */
async function getStoredData(): Promise<StoredVersions> {
	try {
		return JSON.parse(await readFile(getCacheFile(), 'utf8')) as StoredVersions;
	} catch {
		return {};
	}
}

/**
 * Get version
 */
export async function getDownloaderVersion<T extends RemoteDownloaderType>(
	key: string,
	type: T
): Promise<RemoteDownloaderVersionMixin<T> | null> {
	const data = await getStoredData();
	const value = data[key];
	if (value && value.downloadType === type) {
		return value as RemoteDownloaderVersionMixin<T>;
	}
	return null;
}

/**
 * Store downloader version in cache
 */
export async function saveDownloaderVersion(key: string, value: RemoteDownloaderVersion) {
	const filename = getCacheFile();

	// Create directory for cache, if missing
	const dir = dirname(filename);
	try {
		await mkdir(dir, {
			recursive: true,
		});
	} catch {
		//
	}

	// Update data
	const data = await getStoredData();
	data[key] = value;

	// Store file
	await writeFile(filename, JSON.stringify(data, null, '\t'), 'utf8');
}
