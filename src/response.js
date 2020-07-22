/**
 * This file is part of the @iconify/api package.
 *
 * (c) Vjacheslav Trushkin <cyberalien@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

'use strict';

/**
 * Regexp for checking callback attribute
 *
 * @type {RegExp}
 * @private
 */
const callbackMatch = /^[a-z0-9_.]+$/i;

/**
 * Send response
 *
 * @param app
 * @param req
 * @param res
 * @param result
 */
module.exports = (app, req, res, result) => {
	if (typeof result === 'number') {
		// Send error
		if (app.config.cors) {
			res.header('Access-Control-Allow-Origin', app.config.cors.origins);
			res.header('Access-Control-Allow-Methods', app.config.cors.methods);
			res.header('Access-Control-Allow-Headers', app.config.cors.headers);
			res.header('Access-Control-Max-Age', app.config.cors.timeout);
		}
		res.sendStatus(result);
		return;
	}

	// Convert JSON(P) response
	if (result.body === void 0 && result.data !== void 0) {
		if (typeof result.data === 'object') {
			result.body =
				req.query.pretty === '1' || req.query.pretty === 'true'
					? JSON.stringify(result.data, null, 4)
					: JSON.stringify(result.data);
		}

		if (result.js === void 0) {
			result.js = req.query.callback !== void 0;
		}

		if (result.js === true) {
			let callback;
			if (result.callback === void 0 && req.query.callback !== void 0) {
				callback = req.query.callback;
				if (!callback.match(callbackMatch)) {
					// Invalid callback
					res.sendStatus(400);
					return;
				}
			} else {
				callback =
					result.callback === void 0
						? result.defaultCallback
						: result.callback;
				if (callback === void 0) {
					res.sendStatus(400);
					return;
				}
			}
			result.body = callback + '(' + result.body + ');';
			result.type = 'application/javascript; charset=utf-8';
		} else {
			result.type = 'application/json; charset=utf-8';
		}
	}

	// CORS
	if (app.config.cors) {
		res.header('Access-Control-Allow-Origin', app.config.cors.origins);
		res.header('Access-Control-Allow-Methods', app.config.cors.methods);
		res.header('Access-Control-Allow-Headers', app.config.cors.headers);
		res.header('Access-Control-Max-Age', app.config.cors.timeout);
	}

	// Send cache header
	if (
		app.config.cache &&
		app.config.cache.timeout &&
		(req.get('Pragma') === void 0 ||
			req.get('Pragma').indexOf('no-cache') === -1) &&
		(req.get('Cache-Control') === void 0 ||
			req.get('Cache-Control').indexOf('no-cache') === -1)
	) {
		res.set(
			'Cache-Control',
			(app.config.cache.private ? 'private' : 'public') +
				', max-age=' +
				app.config.cache.timeout +
				', min-refresh=' +
				app.config.cache['min-refresh']
		);
		if (!app.config.cache.private) {
			res.set('Pragma', 'cache');
		}
	}

	// Check for download
	if (
		result.filename !== void 0 &&
		(req.query.download === '1' || req.query.download === 'true')
	) {
		res.set(
			'Content-Disposition',
			'attachment; filename="' + result.filename + '"'
		);
	}

	// Send data
	res.type(result.type).send(result.body);
};
