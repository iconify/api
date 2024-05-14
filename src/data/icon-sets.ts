import type { StoredIconSet } from '../types/icon-set/storage.js';
import type { IconSetEntry, Importer } from '../types/importers.js';
import { updateSearchIndex } from './search.js';

/**
 * All importers
 */
let importers: Importer[] | undefined;

export function setImporters(items: Importer[]) {
	if (importers) {
		throw new Error('Importers can be set only once');
	}
	importers = items;
}

/**
 * All prefixes, sorted
 */
let allPrefixes: string[] = [];
let prefixesWithInfo: string[] = [];
let visiblePrefixes: string[] = [];

/**
 * Get all prefixes
 */
type GetPrefixes = 'all' | 'info' | 'visible';
export function getPrefixes(type: GetPrefixes = 'all'): string[] {
	switch (type) {
		case 'all':
			return allPrefixes;

		case 'info':
			return prefixesWithInfo;

		case 'visible':
			return visiblePrefixes;
	}
}

/**
 * All icon sets
 */
export const iconSets = Object.create(null) as Record<string, IconSetEntry>;

/**
 * Loaded icon sets
 */
let loadedIconSets: Set<StoredIconSet> = new Set();

/**
 * Merge data
 */
export function updateIconSets(): number {
	if (!importers) {
		return 0;
	}

	const newLoadedIconSets: Set<StoredIconSet> = new Set();
	const newPrefixes: Set<string> = new Set();
	const newPrefixesWithInfo: Set<string> = new Set();
	const newVisiblePrefixes: Set<string> = new Set();

	importers.forEach((importer, importerIndex) => {
		const data = importer.data;
		if (!data) {
			return;
		}
		data.prefixes.forEach((prefix) => {
			const item = data.iconSets[prefix];
			if (!item) {
				return;
			}

			// Add to list of loaded icon sets
			newLoadedIconSets.add(item);
			loadedIconSets.delete(item);

			// Add prefix, but delete it first to keep order
			newPrefixes.delete(prefix);
			newPrefixesWithInfo.delete(prefix);
			newVisiblePrefixes.delete(prefix);

			newPrefixes.add(prefix);
			if (item.info) {
				newPrefixesWithInfo.add(prefix);
				if (!item.info.hidden) {
					newVisiblePrefixes.add(prefix);
				}
			}

			// Set data
			iconSets[prefix] = {
				importer,
				item,
			};
		});
	});

	// Replace list of icon sets
	if (loadedIconSets.size) {
		// Got some icon sets to clean up
		const cleanup = loadedIconSets;

		// TODO: clean up old icon sets
	}
	loadedIconSets = newLoadedIconSets;

	// Update prefixes
	allPrefixes = Array.from(newPrefixes);
	prefixesWithInfo = Array.from(newPrefixesWithInfo);
	visiblePrefixes = Array.from(newVisiblePrefixes);

	// Update search index
	updateSearchIndex(allPrefixes, iconSets);

	// Purge unused memory if garbage collector global is exposed
	try {
		global.gc?.();
	} catch {}

	return allPrefixes.length;
}

/**
 * Trigger update
 */
export function triggerIconSetsUpdate(index?: number | null, done?: (success?: boolean) => void) {
	if (!importers) {
		done?.();
		return;
	}
	console.log('Checking for updates...');

	(async () => {
		// Clear as much memory as possible by running storage cleanup immediately
		try {
			global.gc?.();
		} catch {}

		// Check for updates
		let updated = false;
		for (let i = 0; i < importers?.length; i++) {
			if (typeof index === 'number' && i !== index) {
				continue;
			}
			updated = (await importers[i].checkForUpdate()) || updated;
		}
		return updated;
	})()
		.then((updated) => {
			console.log(updated ? 'Update complete' : 'Nothing to update');
			updateIconSets();
			done?.(true);
		})
		.catch((err) => {
			console.error(err);
			done?.(false);
		});
}
