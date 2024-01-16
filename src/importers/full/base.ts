import type { BaseDownloader } from '../../downloaders/base.js';
import type { StoredIconSet } from '../../types/icon-set/storage.js';
import type { ImportedData } from '../../types/importers/common.js';
import type { BaseFullImporter } from '../../types/importers/full.js';

/**
 * Base full importer
 */
export function createBaseImporter<Downloader extends BaseDownloader<ImportedData>>(
	instance: Downloader
): Downloader & BaseFullImporter {
	const obj = instance as Downloader & BaseFullImporter;

	// Import status
	let importing = false;

	// Import each icon set
	type ImportIconSetCallback = (prefix: string) => Promise<StoredIconSet | void | undefined>;
	const importIconSets = async (prefixes: string[], callback: ImportIconSetCallback): Promise<ImportedData> => {
		importing = true;

		// Reuse old data
		const data: ImportedData = obj.data || {
			prefixes,
			iconSets: Object.create(null),
		};
		const iconSets = data.iconSets;

		// Parse each prefix
		for (let i = 0; i < prefixes.length; i++) {
			const prefix = prefixes[i];
			const iconSetData = await callback(prefix);
			if (iconSetData) {
				data.iconSets[prefix] = iconSetData;
			}
		}

		// Change status
		importing = false;

		return {
			prefixes,
			iconSets,
		};
	};

	// Import from directory
	obj._loadDataFromDirectory = async (path: string) => {
		if (!obj._loadCollectionsListFromDirectory) {
			throw new Error('Importer does not implement _loadCollectionsListFromDirectory()');
		}
		const loader = obj._loadIconSetFromDirectory;
		if (!loader) {
			throw new Error('Importer does not implement _loadIconSetFromDirectory()');
		}
		const prefixes = await obj._loadCollectionsListFromDirectory(path);
		if (prefixes) {
			return await importIconSets(prefixes, (prefix) => loader(prefix, path));
		}
	};

	// Custom import
	obj._loadData = async () => {
		if (!obj._loadCollectionsList) {
			throw new Error('Importer does not implement _loadCollectionsList()');
		}
		const loader = obj._loadIconSet;
		if (!loader) {
			throw new Error('Importer does not implement _loadIconSet()');
		}
		const prefixes = await obj._loadCollectionsList();
		if (prefixes) {
			return await importIconSets(prefixes, (prefix) => loader(prefix));
		}
	};

	// Set instance properties
	const baseData: BaseFullImporter = {
		type: 'full',
	};
	Object.assign(obj, baseData);

	return obj;
}
