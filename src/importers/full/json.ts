import { readFile } from 'node:fs/promises';
import { matchIconName } from '@iconify/utils/lib/icon/name';
import type { BaseDownloader } from '../../downloaders/base';
import type { ImportedData } from '../../types/importers/common';
import type { BaseFullImporter } from '../../types/importers/full';
import { createBaseImporter } from './base';
import { IconSetJSONOptions, importIconSetFromJSON } from '../common/icon-set-json';

interface IconSetsPackageImporterOptions extends IconSetJSONOptions {
	// Icon set filter
	filter?: (prefix: string) => boolean;
}

/**
 * Create importer for all .json files in directory
 */
export function createIconSetsPackageImporter<Downloader extends BaseDownloader<ImportedData>>(
	downloader: Downloader,
	options: IconSetsPackageImporterOptions = {}
): Downloader & BaseFullImporter {
	const obj = createBaseImporter(downloader);

	// Load collections list
	obj._loadCollectionsListFromDirectory = async (path: string) => {
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

	// Load icon set
	obj._loadIconSetFromDirectory = async (prefix: string, path: string) =>
		importIconSetFromJSON(prefix, path, '/json/' + prefix + '.json', options);

	return obj;
}
