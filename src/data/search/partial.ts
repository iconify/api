import type { PartialKeywords, SearchIndexData } from '../../types/search';
import { searchIndex } from '../search';

export const minPartialKeywordLength = 3;

/**
 * Find partial keywords for keyword
 */
export function getPartialKeywords(
	keyword: string,
	data: SearchIndexData | undefined = searchIndex.data
): PartialKeywords | undefined {
	// const data = searchIndex.data;
	const length = keyword.length;
	if (!data || length < minPartialKeywordLength) {
		return;
	}

	if (data.partial[keyword]) {
		return data.partial[keyword];
	}

	// Cache takes a lot of memory, so clean up old cache once every few minutes before generating new item
	const time = Date.now();
	if (data.partialCleanup < time - 60000) {
		data.partial = Object.create(null);
		data.partialCleanup = time;
	}

	// Generate partial list
	const prefixMatches: string[] = [];
	const suffixMatches: string[] = [];

	// Find similar keywords
	const keywords = data.keywords;
	for (const item in keywords) {
		if (item.length > length) {
			if (item.slice(0, length) === keyword) {
				prefixMatches.push(item);
			} else if (item.slice(0 - length) === keyword) {
				suffixMatches.push(item);
			}
		}
	}

	// Sort: shortest matches first
	return (data.partial[keyword] = prefixMatches
		.sort((a, b) => (a.length === b.length ? a.localeCompare(b) : a.length - b.length))
		.concat(suffixMatches.sort((a, b) => (a.length === b.length ? a.localeCompare(b) : a.length - b.length))));
}
