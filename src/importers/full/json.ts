import { readFile } from 'node:fs/promises';
import type { IconifyInfo } from '@iconify/types';
import { matchIconName } from '@iconify/utils/lib/icon/name';
import type { BaseDownloader } from '../../downloaders/base.js';
import type { ImportedData } from '../../types/importers/common.js';
import type { BaseFullImporter } from '../../types/importers/full.js';
import { createBaseImporter } from './base.js';
import { IconSetJSONOptions, importIconSetFromJSON } from '../common/icon-set-json.js';

interface IconSetsPackageImporterOptions extends IconSetJSONOptions {
	// Icon set filter
	filter?: (prefix: string, info: IconifyInfo) => boolean;
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
		// Log version
		try {
			const packageJSON = JSON.parse(await readFile(path + '/package.json', 'utf8'));
			if (packageJSON.name && packageJSON.version) {
				console.log(`Loading ${packageJSON.name} ${packageJSON.version}`);
			}
		} catch {
			//
		}

		// Get prefixes
		let prefixes: string[];
		let data: Record<string, IconifyInfo>;
		try {
			data = JSON.parse(await readFile(path + '/collections.json', 'utf8')) as Record<string, IconifyInfo>;
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
			prefixes = prefixes.filter((prefix) => filter(prefix, data[prefix]));
		}
		return prefixes;
	};

	// Load icon set
	obj._loadIconSetFromDirectory = async (prefix: string, path: string) =>
		importIconSetFromJSON(prefix, path, '/json/' + prefix + '.json', options);

	return obj;
}
