/**
 * This file is part of the @iconify/api package.
 *
 * (c) Vjacheslav Trushkin <cyberalien@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

'use strict';

const fs = require('fs');
const util = require('util');

// List of imported modules
let imported = Object.create(null);

/**
 * Import json file
 *
 * @param {object|string} app Application object or import method
 * @param {string} file File to import
 * @param {*} [hash] Hash of previously loaded file. If hashes match, load will be aborted
 * @returns {Promise}
 */
module.exports = (app, file, hash) =>
	new Promise((fulfill, reject) => {
		let newHash = null,
			result;

		/**
		 * Parse json using JSONStream library
		 *
		 * @param JSONStream
		 * @param es
		 */
		function parseStream(JSONStream, es) {
			let stream = fs.createReadStream(file, 'utf8'),
				data;

			stream.on('error', err => {
				reject('Error importing ' + file + '\n' + util.format(err));
			});
			stream.on('end', () => {
				result.data = data;
				fulfill(result);
			});
			stream.pipe(JSONStream.parse(true)).pipe(
				es.mapSync(res => {
					data = res;
				})
			);
		}

		/**
		 * Common parser that uses synchronous functions to convert string to object
		 *
		 * @param method
		 */
		function syncParser(method) {
			fs.readFile(file, 'utf8', (err, data) => {
				if (err) {
					reject('Error importing ' + file + '\n' + util.format(err));
					return;
				}
				try {
					switch (method) {
						case 'eval':
							data = Function('return ' + data)();
							break;

						default:
							data = JSON.parse(data);
							break;
					}
				} catch (err) {
					reject('Error importing ' + file + '\n' + util.format(err));
					return;
				}

				result.data = data;
				fulfill(result);
			});
		}

		// Get file information
		fs.lstat(file, (err, stats) => {
			if (!err) {
				// Use file size instead of hash for faster loading
				// assume json files are same when size is not changed
				newHash = stats.size;
			}
			if (newHash && newHash === hash) {
				fulfill({
					changed: false,
					hash: newHash,
				});
				return;
			}

			result = {
				changed: true,
				hash: newHash,
			};

			// Figure out which parser to use
			// 'eval' is fastest, but its not safe
			// 'json' is slower, but might crash when memory limit is low
			// 'stream' is
			let parser = 'parse';
			try {
				parser =
					typeof app === 'string' ? app : app.config['json-loader'];
			} catch (err) {}

			switch (parser) {
				case 'stream':
					// use stream
					if (imported.JSONStream === void 0) {
						try {
							imported.JSONStream = require('JSONStream');
							imported.eventStream = require('event-stream');
						} catch (err) {
							console.error(
								'Cannot use stream JSON parser because JSONStream or event-stream module is not available. Switching to default parser.'
							);
							imported.JSONStream = null;
						}
					}

					if (imported.JSONStream === null) {
						syncParser('json');
					} else {
						parseStream(imported.JSONStream, imported.eventStream);
					}
					break;

				case 'eval':
					// use Function()
					syncParser('eval');
					break;

				default:
					// use JSON.parse()
					syncParser('json');
			}
		});
	});
