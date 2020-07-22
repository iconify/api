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
const promiseEach = require('./promise');

let _app;

let functions = {
	/**
	 * Remove file
	 *
	 * @param file
	 * @param options
	 * @return {Promise<any>}
	 */
	unlink: (file, options) =>
		new Promise((fulfill, reject) => {
			fs.unlink(file, err => {
				if (err) {
					_app.error(
						'Error deleting file ' + file,
						Object.assign(
							{
								key: 'unlink-' + file,
							},
							typeof options === 'object'
								? options
								: Object.create(null)
						)
					);
				}
				fulfill();
			});
		}),

	/**
	 * Recursively remove directory
	 *
	 * @param dir
	 * @param options
	 * @return {Promise<any>}
	 */
	rmdir: (dir, options) =>
		new Promise((fulfill, reject) => {
			options =
				typeof options === 'object' ? options : Object.create(null);

			function done() {
				fs.rmdir(dir, err => {
					if (err) {
						_app.error(
							'Error deleting directory ' + dir,
							Object.assign(
								{
									key: 'rmdir-' + dir,
								},
								options
							)
						);
					}
					fulfill();
				});
			}

			fs.readdir(dir, (err, files) => {
				if (err) {
					// fulfill instead of rejecting
					fulfill();
					return;
				}

				let children = Object.create(null);

				files.forEach(file => {
					let filename = dir + '/' + file,
						stats = fs.lstatSync(filename);

					if (stats.isDirectory()) {
						children[filename] = true;
						return;
					}

					if (stats.isFile() || stats.isSymbolicLink()) {
						children[filename] = false;
					}
				});

				promiseEach(Object.keys(children), file => {
					if (children[file]) {
						return functions.rmdir(file, options);
					} else {
						return functions.unlink(file, options);
					}
				})
					.then(() => {
						done();
					})
					.catch(err => {
						_app.error(
							'Error recursively removing directory ' +
								dir +
								'\n' +
								util.format(err),
							Object.assign(
								{
									key: 'rmdir-' + dir,
								},
								options
							)
						);
						done();
					});
			});
		}),
};

module.exports = app => {
	_app = app;
	return functions;
};
