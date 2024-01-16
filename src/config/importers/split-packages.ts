import { RemoteDownloader } from '../../downloaders/remote.js';
import { createJSONCollectionsListImporter } from '../../importers/collections/collections.js';
import { createJSONPackageIconSetImporter } from '../../importers/icon-set/json-package.js';
import type { IconSetImportedData, ImportedData } from '../../types/importers/common.js';

// Automatically update on startup: boolean
const autoUpdate = true;

/**
 * Importer for all icon sets from `@iconify/collections` and `@iconify-json/*` packages
 *
 * Differences from full importer in `full-package.ts`:
 * - Slower to start because it requires downloading many packages
 * - Easier to automatically keep up to date because each package is updated separately, using less storage
 */
export const splitPackagesImporter = createJSONCollectionsListImporter(
	new RemoteDownloader<ImportedData>(
		{
			downloadType: 'npm',
			package: '@iconify/collections',
		},
		autoUpdate
	),
	(prefix) =>
		createJSONPackageIconSetImporter(
			new RemoteDownloader<IconSetImportedData>(
				{
					downloadType: 'npm',
					package: `@iconify-json/${prefix}`,
				},
				autoUpdate
			),
			{ prefix }
		),
	{
		// Filter icon sets. Returns true if icon set should be included, false if not
		filter: (prefix, info) => {
			return true;
		},
	}
);
