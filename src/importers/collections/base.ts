import type { BaseDownloader } from '../../downloaders/base.js';
import { maybeAwait } from '../../misc/async.js';
import type {
	BaseCollectionsImporter,
	CreateIconSetImporter,
	CreateIconSetImporterResult,
} from '../../types/importers/collections.js';
import type { ImportedData } from '../../types/importers/common.js';

/**
 * Base collections list importer
 */
export function createBaseCollectionsListImporter<Downloader extends BaseDownloader<ImportedData>>(
	instance: Downloader,
	createIconSetImporter: CreateIconSetImporter
): Downloader & BaseCollectionsImporter {
	const obj = instance as Downloader & BaseCollectionsImporter;

	// Importers
	const importers: Record<string, CreateIconSetImporterResult> = Object.create(null);

	// Import status
	let importing = false;

	// Import each icon set
	const importIconSets = async (prefixes: string[]): Promise<ImportedData> => {
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

			let importer = importers[prefix];
			if (!importer) {
				// New item
				importer = importers[prefix] = await maybeAwait(createIconSetImporter(prefix));
				importer._dataUpdated = async (iconSetData) => {
					data.iconSets[prefix] = iconSetData;
					if (!importing) {
						// Call _dataUpdated() if icon set was updated outside of importIconSets()
						obj._dataUpdated?.(data);
					}
				};
				await importer.init();

				// Data should have been updated in init()
				continue;
			}

			// Item already exists: check for update
			await importer.checkForUpdate();
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
		const prefixes = await obj._loadCollectionsListFromDirectory(path);
		if (prefixes) {
			return await importIconSets(prefixes);
		}
	};

	// Custom import
	obj._loadData = async () => {
		if (!obj._loadCollectionsList) {
			throw new Error('Importer does not implement _loadCollectionsList()');
		}
		const prefixes = await obj._loadCollectionsList();
		if (prefixes) {
			return await importIconSets(prefixes);
		}
	};

	// Check for update
	const checkCollectionsForUpdate = obj.checkForUpdate.bind(obj);
	const checkIconSetForUpdate = async (prefix: string): Promise<boolean> => {
		const importer = importers[prefix];
		if (importer) {
			return await importer.checkForUpdate();
		}
		console.error(`Cannot check "${prefix}" for update: no such icon set`);
		return false;
	};

	// Check everything for update
	obj.checkForUpdate = async (): Promise<boolean> => {
		let result = await checkCollectionsForUpdate();
		const prefixes = obj.data?.prefixes.slice(0) || [];
		for (let i = 0; i < prefixes.length; i++) {
			const importer = importers[prefixes[i]];
			if (importer) {
				result = (await importer.checkForUpdate()) || result;
			}
		}
		return result;
	};

	// Set instance properties
	const baseData: BaseCollectionsImporter = {
		type: 'collections',
		checkCollectionsForUpdate,
		checkIconSetForUpdate,
	};
	Object.assign(obj, baseData);

	return obj;
}
