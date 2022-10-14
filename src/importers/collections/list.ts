import { CustomDownloader } from '../../downloaders/custom';
import type { BaseCollectionsImporter, CreateIconSetImporter } from '../../types/importers/collections';
import type { ImportedData } from '../../types/importers/common';
import { createBaseCollectionsListImporter } from './base';

/**
 * Create importer for hardcoded list of icon sets
 */
export function createHardcodedCollectionsListImporter(
	prefixes: string[],
	createIconSetImporter: CreateIconSetImporter
): CustomDownloader<ImportedData> & BaseCollectionsImporter {
	const obj = createBaseCollectionsListImporter(new CustomDownloader<ImportedData>(), createIconSetImporter);

	// Add methods that aren't defined in custom downloader
	obj._init = async () => {
		return prefixes.length > 0;
	};

	obj._checkForUpdate = (done: (value: boolean) => void) => {
		done(false);
	};

	obj._loadCollectionsList = async () => {
		return prefixes;
	};

	return obj;
}
