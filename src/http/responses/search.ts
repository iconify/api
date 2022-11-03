import type { FastifyReply, FastifyRequest } from 'fastify';
import { iconSets } from '../../data/icon-sets';
import { searchIndex } from '../../data/search';
import { search } from '../../data/search/index';
import { paramToBoolean } from '../../misc/bool';
import type { SearchParams } from '../../types/search';
import type { APIv2SearchParams, APIv2SearchResponse } from '../../types/server/v2';
import { checkJSONPQuery, sendJSONResponse } from '../helpers/json';

const minSearchLimit = 32;
const maxSearchLimit = 999;
const defaultSearchLimit = minSearchLimit * 2;

/**
 * Send API v2 response
 */
export function generateAPIv2SearchResponse(query: FastifyRequest['query'], res: FastifyReply) {
	const q = (query || {}) as Record<string, string>;

	const wrap = checkJSONPQuery(q);
	if (!wrap) {
		// Invalid JSONP callback
		res.send(400);
		return;
	}

	// Check if search data is available
	const searchIndexData = searchIndex.data;
	if (!searchIndexData) {
		res.send(404);
		return;
	}

	// Get query
	const keyword = q.query;
	if (!keyword) {
		res.send(400);
		return;
	}

	// Convert to params
	const params: SearchParams = {
		keyword,
		limit: defaultSearchLimit,
	};
	const v2Query = q as unknown as Record<keyof APIv2SearchParams, string>;

	// Get limits
	if (v2Query.limit) {
		const limit = parseInt(v2Query.limit);
		if (!limit) {
			res.send(400);
			return;
		}
		params.limit = Math.max(minSearchLimit, Math.min(limit, maxSearchLimit));
	}

	let start = 0;
	if (v2Query.start) {
		start = parseInt(v2Query.start);
		if (isNaN(start) || start < 0 || start >= params.limit) {
			res.send(400);
			return;
		}
	}

	// Get prefixes
	if (v2Query.prefixes) {
		params.prefixes = v2Query.prefixes.split(',');
	} else if (v2Query.prefix) {
		params.prefixes = [v2Query.prefix];
	} else if (v2Query.collection) {
		params.prefixes = [v2Query.collection];
	}

	// Category
	if (v2Query.category) {
		params.category = v2Query.category;
	}

	// Disable partial
	if (v2Query.similar) {
		const similar = paramToBoolean(v2Query.similar);
		if (typeof similar === 'boolean') {
			params.partial = similar;
		}
	}

	// Run query
	const searchResults = search(params, searchIndexData, iconSets);

	let response: APIv2SearchResponse;
	if (searchResults) {
		// Generate result
		response = {
			icons: searchResults.names.slice(start),
			total: searchResults.names.length,
			limit: params.limit,
			start,
			collections: Object.create(null),
			request: v2Query,
		};

		// Add icon sets
		for (let i = 0; i < searchResults.prefixes.length; i++) {
			const prefix = searchResults.prefixes[i];
			const info = iconSets[prefix]?.item.info;
			if (info) {
				response.collections[prefix] = info;
			}
		}
	} else {
		// No matches
		response = {
			icons: [],
			total: 0,
			limit: params.limit,
			start,
			collections: Object.create(null),
			request: v2Query,
		};
	}

	sendJSONResponse(response, q, wrap, res);
}
