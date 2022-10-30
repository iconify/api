import type { IconSetEntry } from '../../types/importers';
import type { SearchIndexData, SearchParams } from '../../types/search';

/**
 * Filter prefixes by keyword
 */
export function filterSearchPrefixesList(prefixes: readonly string[], filters: string[]): string[] {
	const set = new Set(filters);
	const hasPartial = !!filters.find((item) => item.slice(-1) === '-');
	return prefixes.filter((prefix) => {
		if (set.has(prefix)) {
			return true;
		}
		if (hasPartial) {
			// Check for partial matches
			const parts = prefix.split('-');
			let test = '';
			while (parts.length > 1) {
				test += parts.shift() + '-';
				if (set.has(test)) {
					return true;
				}
			}
		}
		return false;
	});
}

/**
 * Filter prefixes
 */
export function filterSearchPrefixes(
	data: SearchIndexData,
	iconSets: Record<string, IconSetEntry>,
	params: SearchParams
): Readonly<string[]> {
	let prefixes: string[] | undefined;

	// Filter by prefix
	if (params.prefixes) {
		prefixes = filterSearchPrefixesList(prefixes || data.sortedPrefixes, params.prefixes);
	}

	// Filter by palette
	const palette = params.palette;
	if (typeof palette === 'boolean') {
		prefixes = (prefixes || data.sortedPrefixes).filter((prefix) => {
			const info = iconSets[prefix].item.info;
			return info?.palette === palette;
		});
	}

	// TODO: add more filter options

	return prefixes || data.sortedPrefixes;
}
