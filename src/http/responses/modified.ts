import type { FastifyReply, FastifyRequest } from 'fastify';
import { getPrefixes, iconSets } from '../../data/icon-sets';
import type { APIv3LastModifiedResponse } from '../../types/server/modified';
import { checkJSONPQuery, sendJSONResponse } from '../helpers/json';
import { filterPrefixesByPrefix } from '../helpers/prefixes';

/**
 * Generate icons data
 */
export function generateLastModifiedResponse(query: FastifyRequest['query'], res: FastifyReply) {
	const q = (query || {}) as Record<string, string>;
	const wrap = checkJSONPQuery(q);
	if (!wrap) {
		// Invalid JSONP callback
		res.send(400);
		return;
	}

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

	sendJSONResponse(response, q, wrap, res);
}
