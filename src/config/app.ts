import type { AppConfig } from '../types/config/app';
import type { SplitIconSetConfig } from '../types/config/split';
import type { MemoryStorageConfig } from '../types/storage';

/**
 * Main configuration
 */
export const appConfig: AppConfig = {
	// Index page
	redirectIndex: 'https://iconify.design/',

	// Region to add to `/version` response. Used to tell which server is responding when running multiple servers
	statusRegion: '',

	// Cache root directory
	cacheRootDir: 'cache',

	// HTTP headers to send
	headers: [
		'Access-Control-Allow-Origin: *',
		'Access-Control-Allow-Methods: GET, OPTIONS',
		'Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Accept-Encoding',
		'Access-Control-Max-Age: 86400',
		'Cross-Origin-Resource-Policy: cross-origin',
		'Cache-Control: public, max-age=604800, min-refresh=604800',
	],

	// Host and port for server
	host: '0.0.0.0',
	port: 3000,

	// Log stuff
	log: true,
};

/**
 * Splitting icon sets
 */
export const splitIconSetConfig: SplitIconSetConfig = {
	// Average chunk size, in bytes. 0 to disable
	chunkSize: 1000000,

	// Minimum number of icons in one chunk
	minIconsPerChunk: 40,
};

/**
 * Storage configuration
 */
export const storageConfig: MemoryStorageConfig = {
	// Cache directory, use {cache} to point for relative to cacheRootDir from app config
	// Without trailing '/'
	cacheDir: '{cache}/storage',

	// Maximum number of stored items. 0 to disable
	maxCount: 100,

	// Minimum delay in milliseconds when data can expire.
	// Should be set to at least 10 seconds (10000) to avoid repeated read operations
	minExpiration: 20000,

	// Timeout in milliseconds to check expired items, > 0 (if disabled, cleanupAfterSec is not ran)
	timer: 60000,

	// Number of milliseconds to keep item in storage after last use, > minExpiration
	cleanupAfter: 0,
};
