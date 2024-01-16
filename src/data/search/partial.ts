import type { PartialKeywords, SearchIndexData } from '../../types/search.js';
import { searchIndex } from '../search.js';

export const minPartialKeywordLength = 2;

/**
 * Find partial keywords for keyword
 */
export function getPartialKeywords(
	keyword: string,
	suffixes: boolean,
	data: SearchIndexData | undefined = searchIndex.data
): PartialKeywords | undefined {
	// const data = searchIndex.data;
	const length = keyword.length;
	if (!data || length < minPartialKeywordLength) {
		return;
	}

	// Check cache
	const storedItem = (suffixes ? data.partial : data.partialPrefixes)?.[keyword];
	if (storedItem) {
		return storedItem;
	}

	// Cache takes a lot of memory, so clean up old cache once every few minutes before generating new item
	const time = Date.now();
	if (data.partialCleanup < time - 60000) {
		delete data.partial;
		delete data.partialPrefixes;
		data.partialCleanup = time;
	}
	const storageKey = suffixes ? 'partial' : 'partialPrefixes';
	const storage =
		data[storageKey] || (data[storageKey] = Object.create(null) as Exclude<SearchIndexData['partial'], undefined>);

	// Generate partial list
	const prefixMatches: string[] = [];
	const suffixMatches: string[] = [];

	// Find similar keywords
	const keywords = data.keywords;
	for (const item in keywords) {
		if (item.length > length) {
			if (item.slice(0, length) === keyword) {
				prefixMatches.push(item);
			} else if (suffixes && item.slice(0 - length) === keyword) {
				suffixMatches.push(item);
			}
		}
	}

	// Sort: shortest matches first
	return (storage[keyword] = prefixMatches
		.sort((a, b) => (a.length === b.length ? a.localeCompare(b) : a.length - b.length))
		.concat(suffixMatches.sort((a, b) => (a.length === b.length ? a.localeCompare(b) : a.length - b.length))));
}
