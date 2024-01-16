import type { StoredIconSet } from '../icon-set/storage.js';

/**
 * Generated data
 */
export interface StoredCollectionsList {
	// All prefixes
	prefixes: string[];

	// Available icon sets
	iconSets: Record<string, StoredIconSet>;
}
