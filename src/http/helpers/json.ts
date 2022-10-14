import type { FastifyReply } from 'fastify';

const callbackMatch = /^[a-z0-9_.]+$/i;

/**
 * Check JSONP query
 */
interface JSONPStatus {
	wrap: boolean;
	callback: string;
}
export function checkJSONPQuery(
	query: Record<string, string>,
	forceWrap?: boolean,
	defaultCallback?: string
): JSONPStatus | false {
	const wrap = typeof forceWrap === 'boolean' ? forceWrap : !!query.callback;

	if (wrap) {
		const customCallback = query.callback;
		if (customCallback) {
			if (!customCallback.match(callbackMatch)) {
				// Invalid callback
				return false;
			}
			return {
				wrap: true,
				callback: customCallback,
			};
		}

		// No callback provided
		return defaultCallback
			? {
					wrap: true,
					callback: defaultCallback,
			  }
			: false;
	}

	// Do not wrap
	return {
		wrap: false,
		callback: '',
	};
}

/**
 * Send JSON response
 */
export function sendJSONResponse(data: unknown, query: Record<string, string>, wrap: JSONPStatus, res: FastifyReply) {
	// Generate text
	const html = query.pretty ? JSON.stringify(data, null, 4) : JSON.stringify(data);

	// Check for JSONP callback
	if (wrap.wrap) {
		res.type('application/javascript; charset=utf-8');
		res.send(wrap.callback + '(' + html + ');');
	} else {
		res.type('application/json; charset=utf-8');
		res.send(html);
	}
}
