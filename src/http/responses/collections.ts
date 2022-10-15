import type { IconifyInfo } from '@iconify/types';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { getPrefixes, iconSets } from '../../data/icon-sets';
import { checkJSONPQuery, sendJSONResponse } from '../helpers/json';
import { filterPrefixesByPrefix } from '../helpers/prefixes';

/**
 * Send response
 */
export function generateCollectionsListResponse(query: FastifyRequest['query'], res: FastifyReply) {
	const q = (query || {}) as Record<string, string>;
	const wrap = checkJSONPQuery(q);
	if (!wrap) {
		// Invalid JSONP callback
		res.send(400);
		return;
	}

	// Filter prefixes
	const prefixes = filterPrefixesByPrefix(getPrefixes('info'), q, false);
	const response = Object.create(null) as Record<string, IconifyInfo>;

	for (let i = 0; i < prefixes.length; i++) {
		const prefix = prefixes[i];
		const info = iconSets[prefix]?.item.info;
		if (info) {
			response[prefix] = info;
		}
	}

	sendJSONResponse(response, q, wrap, res);
}
