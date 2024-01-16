import { DirectoryDownloader } from '../downloaders/directory.js';
import { createJSONDirectoryImporter } from '../importers/full/directory-json.js';
import { directoryExists } from '../misc/files.js';
import type { Importer } from '../types/importers.js';
import type { ImportedData } from '../types/importers/common.js';
import { fullPackageImporter } from './importers/full-package.js';
import { splitPackagesImporter } from './importers/split-packages.js';

/**
 * Sources
 *
 * Change this function to configure sources for your API instance
 */
export async function getImporters(): Promise<Importer[]> {
	// Result
	const importers: Importer[] = [];

	/**
	 * Import all icon sets from big package
	 *
	 * Uses pre-configured importers. See `importers` sub-directory
	 */
	type IconifyIconSetsOptions = 'full' | 'split' | 'none';
	const iconifyIconSets = (process.env['ICONIFY_SOURCE'] || 'full') as IconifyIconSetsOptions;

	switch (iconifyIconSets) {
		case 'full':
			importers.push(fullPackageImporter);
			break;

		case 'split':
			importers.push(splitPackagesImporter);
			break;
	}

	/**
	 * Add custom icons from `icons` directory
	 */
	if (await directoryExists('icons')) {
		importers.push(
			createJSONDirectoryImporter(new DirectoryDownloader<ImportedData>('icons'), {
				// Skip icon sets with mismatched prefix
				ignoreInvalidPrefix: false,

				// Filter icon sets. Returns true if icon set should be included, false if not.
				filter: (prefix) => {
					return true;
				},
			})
		);
	}

	return importers;
}
