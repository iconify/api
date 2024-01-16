import { appConfig } from '../../config/app.js';
import type { IconSetEntry } from '../../types/importers.js';
import type { SearchIndexData, SearchParams } from '../../types/search.js';

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

	// Filter by palette
	const palette = params.palette;
	if (typeof palette === 'boolean') {
		prefixes = (prefixes || data.sortedPrefixes).filter((prefix) => {
			const info = iconSets[prefix].item.info;
			return info?.palette === palette;
		});
	}

	// Filter by style
	if (appConfig.allowFilterIconsByStyle) {
		const style = params.style;
		if (style) {
			prefixes = (prefixes || data.sortedPrefixes).filter((prefix) => {
				const iconSetStyle = iconSets[prefix].item.icons.iconStyle;
				return iconSetStyle === style || iconSetStyle === 'mixed';
			});
		}
	}

	// Filter by category
	const category = params.category;
	if (category) {
		prefixes = (prefixes || data.sortedPrefixes).filter(
			(prefix) => iconSets[prefix].item.info?.category === category
		);
	}

	// Filter by tag
	const tag = params.tag;
	if (tag) {
		prefixes = (prefixes || data.sortedPrefixes).filter((prefix) => {
			const tags = iconSets[prefix].item.info?.tags;
			return tags && tags.indexOf(tag) !== -1;
		});
	}

	// Filter by prefix
	if (params.prefixes) {
		prefixes = filterSearchPrefixesList(prefixes || data.sortedPrefixes, params.prefixes);
	}

	// TODO: add more filter options

	return prefixes || data.sortedPrefixes;
}
