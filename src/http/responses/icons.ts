import type { FastifyReply, FastifyRequest } from 'fastify';
import { getStoredIconsData } from '../../data/icon-set/utils/get-icons';
import { iconSets } from '../../data/icon-sets';
import { checkJSONPQuery, sendJSONResponse } from '../helpers/json';

/**
 * Generate icons data
 */
export function generateIconsDataResponse(
	prefix: string,
	wrapJS: boolean,
	query: FastifyRequest['query'],
	res: FastifyReply
) {
	const q = (query || {}) as Record<string, string>;
	const names = q.icons?.split(',');

	if (!names || !names.length) {
		// Missing or invalid icons parameter
		res.send(404);
		return;
	}

	// Check for JSONP
	const wrap = checkJSONPQuery(q, wrapJS, 'SimpleSVG._loaderCallback');
	if (!wrap) {
		// Invalid JSONP callback
		res.send(400);
		return;
	}

	// Get icon set
	const iconSet = iconSets[prefix];
	if (!iconSet) {
		// No such icon set
		res.send(404);
		return;
	}

	// Get icons
	getStoredIconsData(iconSet.item, names, (data) => {
		// Send data
		sendJSONResponse(data, q, wrap, res);
	});
}
