import { dirname } from 'node:path';
import { Importer } from '../../types/importers.js';
import { createIconSetsPackageImporter } from '../../importers/full/json.js';
import { ImportedData } from '../../types/importers/common.js';
import { DirectoryDownloader } from '../../downloaders/directory.js';

/**
 * Create importer for package
 */
export function createPackageIconSetImporter(packageName = '@iconify/json'): Importer {
	const dir = dirname(import.meta.resolve(`${packageName}/package.json`));
	return createIconSetsPackageImporter(new DirectoryDownloader<ImportedData>(dir), {});
}
