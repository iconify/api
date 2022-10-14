import type { StoredIconSet } from '../types/icon-set/storage';
import type { IconSetEntry, Importer } from '../types/importers';

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
let prefixes: string[] = [];

/**
 * Get all prefixes
 */
export function getPrefixes(): string[] {
	return prefixes;
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
			newPrefixes.add(prefix);

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
	}
	loadedIconSets = newLoadedIconSets;

	// Update prefixes
	prefixes = Array.from(newPrefixes);
	return prefixes.length;
}
