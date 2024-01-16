import type { DownloaderType } from '../downloaders/base.js';
import type { StoredIconSet } from '../icon-set/storage.js';

/**
 * Base icon set importer interface
 *
 * Properties/methods should be set in functions that create instances
 */
export interface BaseImporter {
	// Downloader type, set in child class
	type: DownloaderType;
}

/**
 * Imported data
 */
export type IconSetImportedData = StoredIconSet;

export interface ImportedData {
	// All prefixes
	prefixes: string[];

	// Icon sets
	iconSets: Record<string, IconSetImportedData | undefined>;
}

/**
 * Base main importer, used for full importer and collections list importer
 *
 * Not used in icon set importer, which is used as a child importer of collections importer
 */
export interface BaseMainImporter extends BaseImporter {
	type: Exclude<DownloaderType, 'icon-set'>;

	// Check for update, calls _replaceIconSetData() to update data
	_updateIconSet?: (prefix: string) => Promise<boolean>;
}
