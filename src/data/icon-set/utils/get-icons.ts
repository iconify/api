import type { IconifyJSON, IconifyAliases, IconifyIcons } from '@iconify/types';
import type { SplitIconifyJSONMainData } from '../../../types/icon-set/split';
import type { StoredIconSet } from '../../../types/icon-set/storage';
import { searchSplitRecordsTreeForSet } from '../../storage/split';
import { getStoredItem } from '../../storage/get';

/**
 * Get list of icons that must be retrieved
 */
export function getIconsToRetrieve(
	iconSetData: SplitIconifyJSONMainData,
	names: string[],
	copyTo?: IconifyAliases
): Set<string> {
	const icons: Set<string> = new Set();
	const aliases = iconSetData.aliases || (Object.create(null) as IconifyAliases);

	function resolve(name: string) {
		if (!aliases[name]) {
			// Icon
			icons.add(name);
			return;
		}

		// Alias: copy it
		const item = aliases[name];
		copyTo && (copyTo[name] = item);

		// Resolve parent
		resolve(item.parent);
	}

	for (let i = 0; i < names.length; i++) {
		resolve(names[i]);
	}

	return icons;
}

/**
 * Extract icons from chunks of icon data
 */
export function getIconsData(
	iconSetData: SplitIconifyJSONMainData,
	names: string[],
	sourceIcons: IconifyIcons[]
): IconifyJSON {
	const sourceAliases = iconSetData.aliases;
	const icons = Object.create(null) as IconifyJSON['icons'];
	const aliases = Object.create(null) as IconifyAliases;

	const result: IconifyJSON = {
		...iconSetData,
		icons,
		aliases,
	};

	function resolve(name: string): boolean {
		if (!sourceAliases[name]) {
			// Icon
			for (let i = 0; i < sourceIcons.length; i++) {
				const item = sourceIcons[i];
				if (name in item) {
					icons[name] = item[name];
					return true;
				}
			}
		} else if (name in sourceAliases) {
			// Alias
			if (name in aliases) {
				// Already resolved
				return true;
			}

			const item = sourceAliases[name];
			if (resolve(item.parent)) {
				aliases[name] = item;
				return true;
			}
		}

		// Missing
		(result.not_found || (result.not_found = [])).push(name);
		return false;
	}

	for (let i = 0; i < names.length; i++) {
		resolve(names[i]);
	}

	return result;
}

/**
 * Get icons from stored icon set
 */
export function getStoredIconsData(iconSet: StoredIconSet, names: string[], callback: (data: IconifyJSON) => void) {
	// Get list of icon names
	const aliases = Object.create(null) as IconifyAliases;
	const iconNames = Array.from(getIconsToRetrieve(iconSet.common, names, aliases));
	if (!iconNames.length) {
		// Nothing to retrieve
		callback({
			...iconSet.common,
			icons: Object.create(null),
			aliases,
			not_found: names,
		});
		return;
	}

	// Get map of chunks to load
	const chunks = searchSplitRecordsTreeForSet(iconSet.tree, iconNames);
	let pending = chunks.size;
	let not_found: string[] | undefined;
	const icons = Object.create(null) as IconifyIcons;

	const storage = iconSet.storage;
	chunks.forEach((names, storedItem) => {
		getStoredItem(storage, storedItem, (data) => {
			// Copy data from chunk
			if (!data) {
				not_found = names.concat(not_found || []);
			} else {
				for (let i = 0; i < names.length; i++) {
					const name = names[i];
					if (data[name]) {
						icons[name] = data[name];
					} else {
						(not_found || (not_found = [])).push(name);
					}
				}
			}

			// Check if all chunks have loaded
			pending--;
			if (!pending) {
				const result: IconifyJSON = {
					...iconSet.common,
					icons,
					aliases,
				};
				if (not_found) {
					result.not_found = not_found;
				}
				callback(result);
			}
		});
	});
}
