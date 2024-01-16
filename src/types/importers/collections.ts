import type { BaseDownloader } from '../../downloaders/base.js';
import type { MaybeAsync } from '../async.js';
import type { BaseMainImporter, IconSetImportedData } from './common.js';
import type { BaseIconSetImporter } from './icon-set.js';

/**
 * Loader for child element
 */
export type CreateIconSetImporterResult = BaseIconSetImporter & BaseDownloader<IconSetImportedData>;
export type CreateIconSetImporter = (prefix: string) => MaybeAsync<CreateIconSetImporterResult>;

/**
 * Base collections list importer
 */
export interface BaseCollectionsImporter extends BaseMainImporter {
	type: 'collections';

	// Load icon sets from directory. Used in importers that implement _loadDataFromDirectory()
	_loadCollectionsListFromDirectory?: (path: string) => Promise<string[] | void | undefined>;

	// Load icon sets. Used in importers that implement _loadData()
	_loadCollectionsList?: () => Promise<string[] | void | undefined>;

	// Check only collections list for update (same as checkForUpdate for full importer)
	checkCollectionsForUpdate: () => Promise<boolean>;

	// Check icon set (same as checkForUpdate for full importer)
	checkIconSetForUpdate: (prefix: string) => Promise<boolean>;
}
