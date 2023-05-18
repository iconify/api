import { appConfig } from '../../config/app';
import type { IconSetIconNames } from '../../types/icon-set/extra';
import type { IconSetEntry } from '../../types/importers';
import type { SearchIndexData, SearchKeywordsEntry, SearchParams, SearchResultsData } from '../../types/search';
import { getPartialKeywords } from './partial';
import { filterSearchPrefixes, filterSearchPrefixesList } from './prefixes';
import { splitKeyword } from './split';

/**
 * Run search
 */
export function search(
	params: SearchParams,
	data: SearchIndexData,
	iconSets: Record<string, IconSetEntry>
): SearchResultsData | undefined {
	// Get keywords
	const keywords = splitKeyword(params.keyword, params.partial);
	if (!keywords) {
		return;
	}

	// Merge params
	const fullParams = {
		...params,
		// Params extracted from query override default params
		...keywords.params,
	};

	// Make sure all keywords exist
	keywords.searches = keywords.searches.filter((search) => {
		for (let i = 0; i < search.keywords.length; i++) {
			if (!data.keywords[search.keywords[i]]) {
				// One of required keywords is missing: no point in searching
				return false;
			}
		}
		return true;
	});
	if (!keywords.searches.length) {
		return;
	}

	// Check for partial
	const partial = keywords.partial;
	let partialKeywords: string[] | undefined;
	let isFirstKeywordExact = true;

	if (partial) {
		// Get all partial keyword matches
		const cache = getPartialKeywords(partial, true, data);
		const exists = data.keywords[partial];
		if (!cache || !cache.length) {
			// No partial matches: check if keyword exists
			if (!exists) {
				return;
			}
			partialKeywords = [partial];
		} else {
			// Partial keywords exist
			isFirstKeywordExact = !!exists;
			partialKeywords = exists ? [partial].concat(cache) : cache.slice(0);
		}
	}

	// Get prefixes
	const basePrefixes = filterSearchPrefixes(data, iconSets, fullParams);

	// Prepare variables
	const addedIcons = Object.create(null) as Record<string, Set<IconSetIconNames>>;

	// Results, sorted
	interface TemporaryResultItem {
		length: number;
		partial: boolean;
		names: string[];
	}
	const allMatches: TemporaryResultItem[] = [];
	let allMatchesLength = 0;
	const getMatchResult = (length: number, partial: boolean): TemporaryResultItem => {
		const result = allMatches.find((item) => item.length === length && item.partial === partial);
		if (result) {
			return result;
		}
		const newItem: TemporaryResultItem = {
			length,
			partial,
			names: [],
		};
		allMatches.push(newItem);
		return newItem;
	};
	const limit = params.limit;

	// Run all searches
	const check = (isExact: boolean, partial?: string) => {
		for (let searchIndex = 0; searchIndex < keywords.searches.length; searchIndex++) {
			// Add prefixes cache to avoid re-calculating it for every partial keyword
			interface ExtendedSearchKeywordsEntry extends SearchKeywordsEntry {
				filteredPrefixes?: Readonly<string[]>;
			}
			const search = keywords.searches[searchIndex] as ExtendedSearchKeywordsEntry;

			// Filter prefixes (or get it from cache)
			let filteredPrefixes: Readonly<string[]>;
			if (search.filteredPrefixes) {
				filteredPrefixes = search.filteredPrefixes;
			} else {
				filteredPrefixes = search.prefixes
					? filterSearchPrefixesList(basePrefixes, search.prefixes)
					: basePrefixes;

				// Filter by required keywords
				for (let i = 0; i < search.keywords.length; i++) {
					filteredPrefixes = filteredPrefixes.filter((prefix) =>
						data.keywords[search.keywords[i]].has(prefix)
					);
				}

				search.filteredPrefixes = filteredPrefixes;
			}
			if (!filteredPrefixes.length) {
				continue;
			}

			// Get keywords
			const testKeywords = partial ? search.keywords.concat([partial]) : search.keywords;
			const testMatches = search.test ? search.test.concat(testKeywords) : testKeywords;

			// Check for partial keyword if testing for exact match
			if (partial) {
				filteredPrefixes = filteredPrefixes.filter((prefix) => data.keywords[partial].has(prefix));
			}

			// Check icons
			for (let prefixIndex = 0; prefixIndex < filteredPrefixes.length; prefixIndex++) {
				const prefix = filteredPrefixes[prefixIndex];
				const prefixAddedIcons = addedIcons[prefix] || (addedIcons[prefix] = new Set());
				const iconSet = iconSets[prefix].item;
				const iconSetIcons = iconSet.icons;
				const iconSetKeywords = iconSetIcons.keywords;
				if (!iconSetKeywords) {
					// This should not happen!
					continue;
				}

				// Check icons in current prefix
				let matches: IconSetIconNames[] | undefined;
				let failed = false;
				for (let keywordIndex = 0; keywordIndex < testKeywords.length && !failed; keywordIndex++) {
					const keyword = testKeywords[keywordIndex];
					const keywordMatches = iconSetKeywords[keyword];
					if (!keywordMatches) {
						failed = true;
						break;
					}

					if (!matches) {
						// Copy all matches
						matches = Array.from(keywordMatches);
					} else {
						// Match previous set
						matches = matches.filter((item) => keywordMatches.has(item));
					}
				}

				// Test matched icons
				if (!failed && matches) {
					for (let matchIndex = 0; matchIndex < matches.length; matchIndex++) {
						const item = matches[matchIndex];
						if (prefixAddedIcons.has(item)) {
							// Already added
							continue;
						}

						// Check style
						if (
							// Style is set
							fullParams.style &&
							// Enabled in config
							appConfig.allowFilterIconsByStyle &&
							// Icon set has mixed style (so it is assigned to icons) -> check icon
							iconSetIcons.iconStyle === 'mixed' &&
							item._is !== fullParams.style
						) {
							// Different icon style
							continue;
						}

						// Find icon name that matches all keywords
						let length: number | undefined;
						const name = item.find((name, index) => {
							for (let i = 0; i < testMatches.length; i++) {
								if (name.indexOf(testMatches[i]) === -1) {
									return false;
								}

								// Get length
								if (!index) {
									// First item sets `_l`, unless it didn't match any prefixes/suffixes
									length = item._l || name.length;
								} else if (iconSet.themeParts) {
									// Alias: calculate length
									const themeParts = iconSet.themeParts;
									for (let partIndex = 0; partIndex < themeParts.length; partIndex++) {
										const part = themeParts[partIndex];
										if (name.startsWith(part + '-') || name.endsWith('-' + part)) {
											length = name.length - part.length - 1;
											break;
										}
									}
								}
							}
							return true;
						});
						if (name) {
							// Add icon
							prefixAddedIcons.add(item);

							const list = getMatchResult(length || name.length, !isExact);
							list.names.push(prefix + ':' + name);
							allMatchesLength++;

							if (!isExact && allMatchesLength >= limit) {
								// Return only if checking for partials and limit reached
								return;
							}
						}
					}
				}
			}
		}
	};

	// Check all keywords
	if (!partialKeywords) {
		check(true);
	} else {
		let partial: string | undefined;
		while ((partial = partialKeywords.shift())) {
			check(isFirstKeywordExact, partial);
			if (allMatchesLength >= limit) {
				break;
			}

			// Next check will be for partial keyword
			isFirstKeywordExact = false;
		}
	}

	// Generate results
	if (allMatchesLength) {
		// Sort matches
		allMatches.sort((a, b) => (a.partial !== b.partial ? (a.partial ? 1 : -1) : a.length - b.length));

		// Extract results
		const results: string[] = [];
		const prefixes: Set<string> = new Set();
		for (let i = 0; i < allMatches.length && results.length < limit; i++) {
			const { names } = allMatches[i];
			for (let j = 0; j < names.length && results.length < limit; j++) {
				const name = names[j];
				results.push(name);
				prefixes.add(name.split(':').shift() as string);
			}
		}

		return {
			prefixes: Array.from(prefixes),
			names: results,
			hasMore: results.length >= limit,
		};
	}
}
