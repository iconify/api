import type { BaseDownloader } from '../downloaders/base.js';
import type { StoredIconSet } from './icon-set/storage.js';
import type { ImportedData } from './importers/common.js';

/**
 * Importer
 */
export type Importer = BaseDownloader<ImportedData>;

/**
 * Icon set data
 */
export interface IconSetEntry {
	// Importer icon set belongs to
	importer: Importer;

	// Data
	item: StoredIconSet;
}
