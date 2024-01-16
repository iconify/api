import type { AppConfig } from '../types/config/app.js';
import type { SplitIconSetConfig } from '../types/config/split.js';
import type { MemoryStorageConfig } from '../types/storage.js';

/**
 * Main configuration
 */
export const appConfig: AppConfig = {
	// Index page
	redirectIndex: 'https://iconify.design/docs/api/',

	// Region to add to `/version` response
	// Used to tell which server is responding when running multiple servers
	// Requires `enableVersion` to be enabled
	statusRegion: '',

	// Cache root directory
	cacheRootDir: 'cache',

	// Host and port for server
	host: '0.0.0.0',
	port: 3000,

	// Log stuff
	log: true,

	// Enable update
	allowUpdate: true,

	// Required parameter to include in `/update` query to trigger update
	// Value must match environment variable `APP_UPDATE_SECRET`
	updateRequiredParam: 'secret',

	// Update check throttling
	// Delay to wait between successful update request and actual update
	updateThrottle: 60,

	// Enables `/version` query
	enableVersion: false,

	// Enable icon sets and icon lists
	// Disable this option if you need API to serve only icon data to save memory
	enableIconLists: true,

	// Enable icon search
	// Requires `enableIconLists` to be enabled
	// Disable this option if you do not need search functionality
	enableSearchEngine: true,

	// Enables filtering icons by style: 'fill' or 'stroke'
	// Works only if search engine is enabled
	allowFilterIconsByStyle: true,
};

/**
 * HTTP headers to send to visitors
 */
export const httpHeaders: string[] = [
	// CORS
	'Access-Control-Allow-Origin: *',
	'Access-Control-Allow-Methods: GET, OPTIONS',
	'Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Accept-Encoding',
	'Access-Control-Max-Age: 86400',
	'Cross-Origin-Resource-Policy: cross-origin',
	// Cache
	'Cache-Control: public, max-age=604800, min-refresh=604800, immutable',
];

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

	// Timeout in milliseconds to check expired items, > 0 (if disabled, cleanupAfter is not ran)
	timer: 60000,

	// Number of milliseconds to keep item in storage after last use, > minExpiration
	cleanupAfter: 0,

	// Asynchronous reading of cache from file system
	asyncRead: true,
};
