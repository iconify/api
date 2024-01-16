import { appConfig } from '../config/app.js';
import type { IconSetEntry } from '../types/importers.js';
import type { SearchIndexData } from '../types/search.js';

interface SearchIndex {
	data?: SearchIndexData;
}

/**
 * Search data
 */
export const searchIndex: SearchIndex = {};

/**
 * Update search index
 */
export function updateSearchIndex(
	prefixes: string[],
	iconSets: Record<string, IconSetEntry>
): SearchIndexData | undefined {
	if (!appConfig.enableIconLists || !appConfig.enableSearchEngine) {
		// Search engine is disabled
		delete searchIndex.data;
		return;
	}

	// Parse all icon sets
	const sortedPrefixes: string[] = [];
	const keywords = Object.create(null) as Record<string, Set<string>>;
	for (let i = 0; i < prefixes.length; i++) {
		const prefix = prefixes[i];
		const iconSet = iconSets[prefix]?.item;
		if (!iconSet) {
			continue;
		}

		const iconSetKeywords = iconSet.icons.keywords;
		if (!iconSetKeywords) {
			continue;
		}

		sortedPrefixes.push(prefix);
		for (const keyword in iconSetKeywords) {
			(keywords[keyword] || (keywords[keyword] = new Set())).add(prefix);
		}
	}

	// Set data
	return (searchIndex.data = {
		sortedPrefixes,
		keywords,
		partialCleanup: Date.now(),
	});
}
