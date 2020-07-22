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
 * Alternative to Promise.all() that runs each promise after another, not simultaneously
 *
 * @param list
 * @param callback
 * @returns {Promise<any>}
 */
module.exports = (list, callback) =>
	new Promise((fulfill, reject) => {
		let results = [],
			index = -1,
			total = list.length;

		function next() {
			index++;
			if (index === total) {
				fulfill(results);
				return;
			}

			let promise = callback(list[index]);
			if (promise === null) {
				// skip
				next();
				return;
			}
			promise
				.then(result => {
					results.push(result);
					next();
				})
				.catch(err => {
					reject(err);
				});
		}

		next();
	});
