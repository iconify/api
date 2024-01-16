import { readFile } from 'node:fs/promises';
import { matchIconName } from '@iconify/utils/lib/icon/name';
import type { BaseDownloader } from '../../downloaders/base.js';
import { DirectoryDownloader } from '../../downloaders/directory.js';
import type { StoredIconSet } from '../../types/icon-set/storage.js';
import type { BaseCollectionsImporter, CreateIconSetImporter } from '../../types/importers/collections.js';
import type { ImportedData } from '../../types/importers/common.js';
import { createJSONIconSetImporter } from '../icon-set/json.js';
import { createBaseCollectionsListImporter } from '../collections/base.js';

interface IconSetsPackageImporterOptions {
	// Icon set filter
	filter?: (prefix: string) => boolean;
}

/**
 * Create importer for all .json files in directory
 */
export function _createIconSetsPackageImporter<Downloader extends BaseDownloader<ImportedData>>(
	downloader: Downloader,
	options?: IconSetsPackageImporterOptions
): Downloader & BaseCollectionsImporter {
	// Path to import from
	let importPath: string | undefined;

	// Function to create importer
	const createIconSetImporter: CreateIconSetImporter = (prefix) => {
		if (!importPath) {
			throw new Error('Importer called before path was set');
		}
		return createJSONIconSetImporter(new DirectoryDownloader<StoredIconSet>(importPath), {
			prefix,
			filename: `/json/${prefix}.json`,
		});
	};
	const obj = createBaseCollectionsListImporter(downloader, createIconSetImporter);

	// Load data
	obj._loadCollectionsListFromDirectory = async (path: string) => {
		importPath = path;

		let prefixes: string[];
		try {
			const data = JSON.parse(await readFile(path + '/collections.json', 'utf8')) as Record<string, unknown>;
			prefixes = Object.keys(data).filter((prefix) => matchIconName.test(prefix));

			if (!(prefixes instanceof Array)) {
				console.error(`Error loading "collections.json": invalid data`);
				return;
			}
		} catch (err) {
			console.error(err);
			return;
		}

		// Filter keys
		const filter = options?.filter;
		if (filter) {
			prefixes = prefixes.filter(filter);
		}
		return prefixes;
	};

	return obj;
}
