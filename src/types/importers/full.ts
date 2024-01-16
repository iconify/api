import type { BaseMainImporter, IconSetImportedData } from './common.js';

/**
 * Base full importer
 */
export interface BaseFullImporter extends BaseMainImporter {
	type: 'full';

	// Load icon sets from directory. Used in importers that implement _loadDataFromDirectory()
	_loadCollectionsListFromDirectory?: (path: string) => Promise<string[] | void | undefined>;

	// Load icon set from directory. Used in importers that implement _loadDataFromDirectory()
	_loadIconSetFromDirectory?: (prefix: string, path: string) => Promise<IconSetImportedData | void | undefined>;

	// Load icon sets. Used in importers that implement _loadData()
	_loadCollectionsList?: () => Promise<string[] | void | undefined>;

	// Load icon set. Used in importers that implement _loadData()
	_loadIconSet?: (prefix: string) => Promise<IconSetImportedData | void | undefined>;
}
