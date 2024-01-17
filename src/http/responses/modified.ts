import { getPrefixes, iconSets } from '../../data/icon-sets.js';
import type { APIv3LastModifiedResponse } from '../../types/server/modified.js';
import { filterPrefixesByPrefix } from '../helpers/prefixes.js';

/**
 * Get last modified time for all icon sets
 */
export function createLastModifiedResponse(q: Record<string, string>): number | APIv3LastModifiedResponse {
	// Filter prefixes
	const prefixes = filterPrefixesByPrefix(getPrefixes(), q, false);

	// Generate result
	const lastModified = Object.create(null) as Record<string, number>;
	const response: APIv3LastModifiedResponse = {
		lastModified,
	};

	for (let i = 0; i < prefixes.length; i++) {
		const prefix = prefixes[i];
		const item = iconSets[prefix];
		if (item) {
			const value = item.item.common.lastModified;
			if (value) {
				lastModified[prefix] = value;
			}
		}
	}

	return response;
}
