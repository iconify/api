import type { FastifyReply, FastifyRequest } from 'fastify';
import { getPrefixes, iconSets } from '../../data/icon-sets';
import type { LastModifiedAPIResponse } from '../../types/server/modified';
import { checkJSONPQuery, sendJSONResponse } from '../helpers/json';
import { filterPrefixes } from '../helpers/prefixes';

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
	const prefixes = filterPrefixes(getPrefixes(), q, false);

	// Generate result
	const lastModified = Object.create(null) as Record<string, number>;
	const response: LastModifiedAPIResponse = {
		lastModified,
	};
	let found = false;

	for (let i = 0; i < prefixes.length; i++) {
		const prefix = prefixes[i];
		const item = iconSets[prefix];
		if (item) {
			const value = item.item.common.lastModified;
			if (value) {
				found = true;
				lastModified[prefix] = value;
			}
		}
	}

	if (!found) {
		// No matches
		res.send(404);
		return;
	}
	sendJSONResponse(response, q, wrap, res);
}
