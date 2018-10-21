/**
 * This file is part of the @iconify/api package.
 *
 * (c) Vjacheslav Trushkin <cyberalien@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

"use strict";

const generateSVG = require('./svg');

/**
 * Regexp for checking callback attribute
 *
 * @type {RegExp}
 * @private
 */
const _callbackMatch = /^[a-z0-9_.]+$/i;

/**
 * Generate data for query
 *
 * @param {Collection} collection
 * @param {string} query Query string after last / without extension
 * @param {string} ext Extension
 * @param {object} params Parameters
 * @returns {number|object}
 */
module.exports = (collection, query, ext, params) => {
    switch (ext) {
        case 'svg':
            // Generate SVG
            // query = icon name
            let icon = collection.getIcon(query);
            if (icon === null) {
                return 404;
            }
            return {
                filename: query + '.svg',
                type: 'image/svg+xml; charset=utf-8',
                body: generateSVG(icon, params)
            };

        case 'js':
        case 'json':
            if (query !== 'icons' || typeof params.icons !== 'string') {
                return 404;
            }

            let result = collection.getIcons(params.icons.split(','));

            if (!Object.keys(result.icons).length) {
                return 404;
            }
            if (!Object.keys(result.aliases).length) {
                delete result.aliases;
            }
            result = JSON.stringify(result);

            if (ext === 'js') {
                let callback;
                if (params.callback !== void 0) {
                    callback = params.callback;
                    if (!callback.match(_callbackMatch)) {
                        return 400;
                    }
                } else {
                    callback = 'SimpleSVG._loaderCallback';
                }
                return {
                    type: 'application/javascript; charset=utf-8',
                    body: callback + '(' + result + ')'
                };
            }
            return {
                type: 'application/json; charset=utf-8',
                body: result
            };

        default:
            return 404;
    }
};