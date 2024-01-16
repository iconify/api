import type { BaseImporter, IconSetImportedData } from './common.js';

/**
 * Base icon set importer interface
 *
 * Properties/methods should be set in functions that create instances
 */
export interface BaseIconSetImporter extends BaseImporter {
	type: 'icon-set';

	// Icon set prefix, set when creating instance
	prefix: string;

	// Loader for each icon set
	_loadIconSet?: () => Promise<IconSetImportedData | void | undefined>;
}
