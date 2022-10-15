import type { IconifyInfo, IconifyJSON } from '@iconify/types';

/**
 * /list-icons
 * /list-icons-categorized
 *
 * Do not use, supported only for legacy software that should no longer be used
 */
export interface APIv1ListIconsParams {
	// Icon set prefix
	prefix: string;

	// Include info in response
	info?: boolean;

	// Include aliases in response
	aliases?: boolean;

	// Include characters in response
	chars?: boolean;
}

export interface APIv1ListIconsBaseResponse {
	// Icon set prefix
	prefix: string;

	// Number of icons (duplicate of info?.total)
	total: number;

	// Icon set title, if available (duplicate of info?.name)
	title?: string;

	// Icon set info
	info?: IconifyInfo;

	// List of aliases, key = alias, value = parent icon
	aliases?: Record<string, string>;

	// Characters, key = character, value = icon name
	chars?: Record<string, string>;
}

export interface APIv1ListIconsResponse extends APIv1ListIconsBaseResponse {
	// Icons
	icons: string[];
}

export interface APIv1ListIconsCategorisedResponse extends APIv1ListIconsBaseResponse {
	// Icons, sorted by category
	categories?: Record<string, string[]>;

	// Icons, sorted by category
	uncategorized?: string[];

	// Themes
	themes?: IconifyJSON['themes'];
}

/**
 * Same as above, but with `prefixes` parameter set
 *
 * Result is object, where prefix is key, value is icons list
 */
export interface APIv1ListIconsPrefixedParams extends Omit<APIv1ListIconsParams, 'prefix'> {
	// Comma separated list of prefix matches: 'mdi,mdi-'
	// If value ends with '-', it is treated as partial prefix
	prefixes: string;
}

export type APIv1ListIconsPrefixedResponse = Record<string, APIv1ListIconsResponse>;

export type APIv1ListIconsCategorisedPrefixedResponse = Record<string, APIv1ListIconsCategorisedResponse>;
