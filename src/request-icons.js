/**
 * This file is part of the @iconify/api package.
 *
 * (c) Vjacheslav Trushkin <cyberalien@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

'use strict';

const SVG = require('@iconify/json-tools').SVG;

/**
 * Generate SVG string
 *
 * @param {object} icon
 * @param {object} [params]
 * @returns {string}
 */
function generateSVG(icon, params) {
	let svg = new SVG(icon);
	return svg.getSVG(params);
}

/**
 * Regexp for checking callback attribute
 *
 * @type {RegExp}
 * @private
 */
const _callbackMatch = /^[a-z0-9_.]+$/i;

/**
 * Parse request
 *
 * @param {object} app
 * @param {object} req
 * @param {object} res
 * @param {string} prefix Collection prefix
 * @param {string} query Query
 * @param {string} ext Extension
 */
module.exports = (app, req, res, prefix, query, ext) => {
	if (app.collections[prefix] === void 0) {
		app.response(req, res, 404);
		return;
	}

	let collection = app.collections[prefix],
		params = req.query;

	let parse = () => {
		switch (ext) {
			case 'svg':
				// Generate SVG
				// query = icon name
				let icon = collection.getIconData(query);
				if (icon === null) {
					return 404;
				}
				return {
					filename: query + '.svg',
					type: 'image/svg+xml; charset=utf-8',
					body: generateSVG(icon, params),
				};

			case 'js':
			case 'json':
				if (query !== 'icons' || typeof params.icons !== 'string') {
					return 404;
				}

				let icons = params.icons.split(',');
				let result = collection.getIcons(icons, true);

				// Return 404 for JSON query, data for JS query
				if (result === null) {
					if (ext === 'json') {
						return 404;
					}
					return {
						js: ext === 'js',
						defaultCallback: 'SimpleSVG._loaderCallback',
						data: {
							prefix: prefix,
							not_found: icons,
						},
					};
				}

				if (
					result.aliases !== void 0 &&
					!Object.keys(result.aliases).length
				) {
					delete result.aliases;
				}

				return {
					js: ext === 'js',
					defaultCallback: 'SimpleSVG._loaderCallback',
					data: result,
				};

			default:
				return 404;
		}
	};

	app.response(req, res, parse());
};
