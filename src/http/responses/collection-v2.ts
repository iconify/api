import { iconSets } from '../../data/icon-sets.js';
import type { APIv2CollectionResponse } from '../../types/server/v2.js';

/**
 * Send API v2 response
 *
 * This response ignores the following parameters:
 * - `aliases` -> always enabled
 * - `hidden` -> always enabled
 *
 * Those parameters are always requested anyway, so does not make sense to re-create data in case they are disabled
 */
export function createAPIv2CollectionResponse(q: Record<string, string>): APIv2CollectionResponse | number {
	// Get icon set
	const prefix = q.prefix;
	if (!prefix || !iconSets[prefix]) {
		return 404;
	}

	const iconSet = iconSets[prefix].item;
	const apiV2IconsCache = iconSet.apiV2IconsCache;
	if (!apiV2IconsCache) {
		// Disabled
		return 404;
	}

	// Generate response
	const response: APIv2CollectionResponse = {
		...apiV2IconsCache,
		...iconSet.themes,
	};

	if (!q.info) {
		// Delete info
		delete response.info;
	}
	if (!q.chars) {
		// Remove characters map
		delete response.chars;
	}

	return response;
}
