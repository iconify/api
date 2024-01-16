import { readdir, stat } from 'node:fs/promises';
import { matchIconName } from '@iconify/utils/lib/icon/name';
import type { BaseDownloader } from '../../downloaders/base.js';
import { DirectoryDownloader } from '../../downloaders/directory.js';
import type { StoredIconSet } from '../../types/icon-set/storage.js';
import type { BaseCollectionsImporter, CreateIconSetImporter } from '../../types/importers/collections.js';
import type { ImportedData } from '../../types/importers/common.js';
import { createJSONIconSetImporter } from '../icon-set/json.js';
import { createBaseCollectionsListImporter } from '../collections/base.js';

interface JSONDirectoryImporterOptions {
	// Icon set filter
	filter?: (prefix: string) => boolean;
}

/**
 * Create importer for all .json files in directory
 */
export function _createJSONDirectoryImporter<Downloader extends BaseDownloader<ImportedData>>(
	downloader: Downloader,
	options?: JSONDirectoryImporterOptions
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
			filename: `/${prefix}.json`,
		});
	};
	const obj = createBaseCollectionsListImporter(downloader, createIconSetImporter);

	// Load data
	obj._loadCollectionsListFromDirectory = async (path: string) => {
		importPath = path;

		let prefixes: string[] = [];
		try {
			const files = await readdir(path);
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const parts = file.split('.');
				if (parts.length !== 2 || parts.pop() !== 'json' || !matchIconName.test(parts[0])) {
					continue;
				}
				const data = await stat(path + '/' + file);
				if (data.isFile()) {
					prefixes.push(parts[0]);
				}
			}
		} catch (err) {
			console.error(err);
			return;
		}

		// Filter prefixes
		const filter = options?.filter;
		if (filter) {
			prefixes = prefixes.filter(filter);
		}
		return prefixes;
	};

	return obj;
}
