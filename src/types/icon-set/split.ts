import type { IconifyAliases, IconifyJSONIconsData } from '@iconify/types';

/**
 * Main data:
 *
 * prefix
 * aliases
 * ...optional icon dimensions
 * lastModified
 */
export interface SplitIconifyJSONMainData extends Omit<IconifyJSONIconsData, 'provider' | 'icons'> {
	// Last modified time
	lastModified?: number;

	// Aliases, required
	aliases: IconifyAliases;
}
