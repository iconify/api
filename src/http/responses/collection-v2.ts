import type { FastifyReply, FastifyRequest } from 'fastify';
import { iconSets } from '../../data/icon-sets';
import type { APIv2CollectionResponse } from '../../types/server/v2';
import { checkJSONPQuery, sendJSONResponse } from '../helpers/json';

/**
 * Send API v2 response
 *
 * This response ignores the following parameters:
 * - `aliases` -> always enabled
 * - `hidden` -> always enabled
 *
 * Those parameters are always requested anyway, so does not make sense to re-create data in case they are disabled
 */
export function generateAPIv2CollectionResponse(query: FastifyRequest['query'], res: FastifyReply) {
	const q = (query || {}) as Record<string, string>;

	const wrap = checkJSONPQuery(q);
	if (!wrap) {
		// Invalid JSONP callback
		res.send(400);
		return;
	}

	// Get icon set
	const prefix = q.prefix;
	if (!prefix || !iconSets[prefix]) {
		res.send(404);
		return;
	}

	const iconSet = iconSets[prefix].item;
	const apiV2IconsCache = iconSet.apiV2IconsCache;
	if (!apiV2IconsCache) {
		// Disabled
		res.send(404);
		return;
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

	sendJSONResponse(response, q, wrap, res);
}
