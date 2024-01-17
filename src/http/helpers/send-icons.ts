import type { FastifyReply, FastifyRequest } from 'fastify';
import { checkJSONPQuery, sendJSONResponse } from './json.js';
import { createIconsDataResponse } from '../responses/icons.js';

type CallbackResult = object | number;

/**
 * Handle icons data API response
 */
export function handleIconsDataResponse(
	prefix: string,
	wrapJS: boolean,
	query: FastifyRequest['query'],
	res: FastifyReply
) {
	const q = (query || {}) as Record<string, string>;

	// Check for JSONP
	const wrap = checkJSONPQuery(q, wrapJS, 'SimpleSVG._loaderCallback');
	if (!wrap) {
		// Invalid JSONP callback
		res.send(400);
		return;
	}

	// Function to send response
	const respond = (result: CallbackResult) => {
		if (typeof result === 'number') {
			res.send(result);
		} else {
			sendJSONResponse(result, q, wrap, res);
		}
	};

	// Get result
	const result = createIconsDataResponse(prefix, q);
	if (result instanceof Promise) {
		result.then(respond).catch((err) => {
			console.error(err);
			respond(500);
		});
	} else {
		respond(result);
	}
}
