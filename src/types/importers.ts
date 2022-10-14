import type { BaseDownloader } from '../downloaders/base';
import type { StoredIconSet } from './icon-set/storage';
import type { ImportedData } from './importers/common';

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
