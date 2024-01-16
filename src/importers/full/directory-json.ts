import { readdir, stat } from 'node:fs/promises';
import { matchIconName } from '@iconify/utils/lib/icon/name';
import type { BaseDownloader } from '../../downloaders/base.js';
import type { ImportedData } from '../../types/importers/common.js';
import type { BaseFullImporter } from '../../types/importers/full.js';
import { createBaseImporter } from './base.js';
import { type IconSetJSONOptions, importIconSetFromJSON } from '../common/icon-set-json.js';

interface JSONDirectoryImporterOptions extends IconSetJSONOptions {
	// Icon set filter
	filter?: (prefix: string) => boolean;
}

/**
 * Create importer for all .json files in directory
 */
export function createJSONDirectoryImporter<Downloader extends BaseDownloader<ImportedData>>(
	downloader: Downloader,
	options: JSONDirectoryImporterOptions = {}
): Downloader & BaseFullImporter {
	const obj = createBaseImporter(downloader);

	// Load data
	obj._loadCollectionsListFromDirectory = async (path: string) => {
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

	// Load icon set
	obj._loadIconSetFromDirectory = (prefix: string, path: string) =>
		importIconSetFromJSON(prefix, path, '/' + prefix + '.json', options);

	return obj;
}
