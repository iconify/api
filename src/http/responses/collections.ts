import { getPrefixes, iconSets } from '../../data/icon-sets.js';
import type { APIv2CollectionsResponse } from '../../types/server/v2.js';
import { filterPrefixesByPrefix } from '../helpers/prefixes.js';

/**
 * Send response
 *
 * Request and responses are the same for v2 and v3
 *
 * Ignored parameters:
 * - hidden (always enabled)
 */
export function createCollectionsListResponse(q: Record<string, string>): APIv2CollectionsResponse {
	// Filter prefixes
	const prefixes = filterPrefixesByPrefix(getPrefixes('info'), q, false);
	const response = Object.create(null) as APIv2CollectionsResponse;

	for (let i = 0; i < prefixes.length; i++) {
		const prefix = prefixes[i];
		const info = iconSets[prefix]?.item.info;
		if (info) {
			response[prefix] = info;
		}
	}

	return response;
}
