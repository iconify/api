import type { IconStyle } from './icon-set/extra.js';

/**
 * List of keywords that can be used to autocomplete keyword
 */
export type PartialKeywords = Readonly<string[]>;

/**
 * Search data
 */
export interface SearchIndexData {
	// List of searchable prefixes
	sortedPrefixes: string[];

	// List of keywords, value is set of prefixes where keyword is used
	// Prefixes are added in set in same order as in `sortedPrefixes`
	keywords: Record<string, Set<string>>;

	// Partial keywords: ['foo'] = ['foo1', 'foo2', 'foobar', ...]
	// Can be used for auto-completion for search results
	// Keywords are generated on demand and sorted by length: shortest first
	partial?: Record<string, PartialKeywords>;
	partialPrefixes?: Record<string, PartialKeywords>;

	// Last cleanup for old partial lists
	partialCleanup: number;
}

/**
 * Search parameters
 */
export interface SearchParams {
	// List of prefixes to search
	prefixes?: string[];

	// Icon set category
	category?: string;

	// Icon set tag
	tag?: string;

	// Filter icon sets by palette
	palette?: boolean;

	// Filter icons by style
	style?: IconStyle;

	// Keyword
	keyword: string;

	// Search results limit
	limit: number;
	softLimit?: boolean; // True if limit can be exceeded

	// Toggle partial matches
	partial?: boolean;
}

/**
 * List of matches
 */
export interface SearchKeywordsEntry {
	// List of prefixes, extracted from search query
	prefixes?: string[];

	// List of keywords icon should match
	keywords: string[];

	// Strings to test icon value
	test?: string[];

	// Partial keyword
	partial?: string;
}

/**
 * Searches
 */
export interface SearchKeywords {
	// List of searches
	searches: SearchKeywordsEntry[];

	// Params extracted from keywords
	params: Partial<SearchParams>;
}

/**
 * Search results
 */
export interface SearchResultsData {
	// Prefixes
	prefixes: string[];

	// Icon names
	names: string[];

	// True if has more results
	hasMore?: boolean;
}
