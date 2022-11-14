/**
 * Cache status
 */
export interface MemoryStorageCache {
	// Cache filename
	filename: string;

	// True if cache exists, false if needs to be written
	exists: boolean;
}

/**
 * Callback
 */
export type MemoryStorageCallback<T> = (data: T | null) => void;

/**
 * Stored item state
 */
export interface MemoryStorageItem<T> {
	// Cache, empty if data should not be stored in cache
	cache?: MemoryStorageCache;

	// Pending callbacks
	callbacks: MemoryStorageCallback<T>[];

	// Last used time
	lastUsed: number;

	// Data, if loaded
	data?: T;
}

/**
 * Storage configuration
 */
export interface MemoryStorageConfig {
	// Cache directory, use {cache} to point for relative to cacheRootDir from app config
	// Without trailing '/'
	cacheDir: string;

	// Maximum number of stored items. 0 to disable
	maxCount?: number;

	// Minimum delay in milliseconds when data can expire.
	// Should be set to at least 10 seconds (10000) to avoid repeated read operations
	minExpiration?: number;

	// Timeout in milliseconds to check expired items, > 0 (if disabled, cleanupAfter is not ran)
	timer?: number;

	// Number of milliseconds to keep item in storage after last use, > minExpiration
	cleanupAfter?: number;

	// Asynchronous reading
	asyncRead?: boolean;

	// Timer callback, used for debugging and testing. Called before cleanup when its triggered by timer
	timerCallback?: () => void;
}

/**
 * Storage
 */
export interface MemoryStorage<T> {
	// Configuration
	config: MemoryStorageConfig;

	// Pending writes and reads
	pendingWrites: Set<MemoryStorageItem<T>>;
	pendingReads: Set<MemoryStorageItem<T>>;

	// Timer for cleanup
	timer?: ReturnType<typeof setTimeout>;

	// Watched items
	watched: Set<MemoryStorageItem<T>>;

	// Minimum `lastUsed` value from last sort. Used to avoid re-sorting too often
	minLastUsed?: number;
}
