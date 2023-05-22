import type { IconifyInfo, IconifyJSON } from '@iconify/types';

/**
 * Common stuff
 */
interface APIv2CommonParams {
	// Pretty output, default = false
	pretty?: boolean;
}

/**
 * Prefixes list
 *
 * Separated by ','
 * Ends with '-' = partial prefix: 'fa-'
 * Does not end with '-' = full prefix: 'mdi'
 */
type PrefixesMatches = string;

/**
 * Search query string
 *
 * List of queries, split by whitespace. Must match all queries
 * Entry starts with '-': exclude it
 */
type SearchQuery = string;

/**
 * /collections
 */
export interface APIv2CollectionsParams extends APIv2CommonParams {
	// Useless
	version?: 1;

	// Include hidden icon sets
	hidden?: boolean;

	// Filter icon sets by prefixes
	prefixes?: PrefixesMatches;
}

export type APIv2CollectionsResponse = Record<string, IconifyInfo>;

/**
 * /collection
 */
export interface APIv2CollectionParams extends APIv2CommonParams {
	// Icon set prefix
	prefix: string;

	// Include icon set info in response
	info?: boolean;

	// Include aliases in response
	aliases?: boolean;

	// Include characters in response
	chars?: boolean;

	// Include hidden icons
	hidden?: boolean;
}

export interface APIv2CollectionResponse {
	// Icon set prefix
	prefix: string;

	// Number of icons (duplicate of info?.total)
	total: number;

	// Icon set title, if available (duplicate of info?.name)
	title?: string;

	// Icon set info
	info?: IconifyInfo;

	// List of icons without categories
	uncategorized?: string[];

	// List of icons, sorted by category
	categories?: Record<string, string[]>;

	// List of hidden icons
	hidden?: string[];

	// List of aliases, key = alias, value = parent icon
	aliases?: Record<string, string>;

	// Characters, key = character, value = icon name
	chars?: Record<string, string>;

	// Themes
	themes?: IconifyJSON['themes']; // Deprecated, so it can be ignored
	prefixes?: IconifyJSON['prefixes'];
	suffixes?: IconifyJSON['suffixes'];
}

/**
 * /search
 */
export interface APIv2SearchParams extends APIv2CommonParams {
	// Search string
	query: SearchQuery;

	// Maximum number of items in response
	// If `min` is set, `limit` is ignored
	limit?: number; // Hard limit. Number of results will not exceed `limit`.
	min?: number; // Soft limit. Number of results can exceed `limit` if function already retrieved more icons.

	// Start index for results
	start?: number;

	// Filter icon sets by prefixes
	prefix?: string; // One prefix
	collection?: string; // One prefix
	prefixes?: PrefixesMatches; // Multiple prefixes or partial

	// Filter icon sets by category
	category?: string;

	// Include similar keywords (partial matches for words), default = true
	similar?: boolean;
}

export interface APIv2SearchResponse {
	// List of icons, including prefixes
	icons: string[];

	// Number of results. If same as `limit`, more results are available
	total: number;

	// Maximum number of items allowed by query
	limit: number;

	// Index of first result
	start: number;

	// Info about icon sets
	collections: Record<string, IconifyInfo>;

	// Copy of request, values are string
	request: Record<keyof APIv2SearchParams, string>;
}
