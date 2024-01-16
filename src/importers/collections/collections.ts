import { readFile } from 'node:fs/promises';
import type { IconifyInfo } from '@iconify/types';
import { matchIconName } from '@iconify/utils/lib/icon/name';
import type { BaseDownloader } from '../../downloaders/base.js';
import type { BaseCollectionsImporter, CreateIconSetImporter } from '../../types/importers/collections.js';
import type { ImportedData } from '../../types/importers/common.js';
import { createBaseCollectionsListImporter } from './base.js';

interface JSONCollectionsListImporterOptions {
	// File to load
	filename?: string;

	// Icon set filter
	filter?: (prefix: string, info: IconifyInfo) => boolean;
}

/**
 * Create importer for `collections.json`
 */
export function createJSONCollectionsListImporter<Downloader extends BaseDownloader<ImportedData>>(
	downloader: Downloader,
	createIconSetImporter: CreateIconSetImporter,
	options?: JSONCollectionsListImporterOptions
): Downloader & BaseCollectionsImporter {
	const obj = createBaseCollectionsListImporter(downloader, createIconSetImporter);

	// Load data
	obj._loadCollectionsListFromDirectory = async (path: string) => {
		let prefixes: string[];
		let data: Record<string, IconifyInfo>;
		const filename = options?.filename || '/collections.json';
		try {
			data = JSON.parse(await readFile(path + filename, 'utf8')) as Record<string, IconifyInfo>;
			prefixes = Object.keys(data).filter((prefix) => matchIconName.test(prefix));

			if (!(prefixes instanceof Array)) {
				console.error(`Error loading "${filename}": invalid data`);
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

	return obj;
}
