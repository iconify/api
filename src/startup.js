/**
 * This file is part of the @iconify/api package.
 *
 * (c) Vjacheslav Trushkin <cyberalien@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

'use strict';

const util = require('util');
const promiseEach = require('./promise');

module.exports = app =>
	new Promise((fulfill, reject) => {
		let actions = [],
			logger = app.logger('Starting API...', 60),
			start = Date.now();

		// Check for repositories to synchronize
		if (app.config.canSync) {
			switch (app.config['sync-on-startup']) {
				case 'always':
				case 'missing':
					app.dirs.getRepos().forEach(repo => {
						if (
							app.sync[repo] &&
							(app.config['sync-on-startup'] === 'always' ||
								!app.dirs.synchronized(repo))
						) {
							actions.push({
								action: 'sync',
								repo: repo,
							});
						}
					});
					break;
			}
		}

		// Load icons
		actions.push({
			action: 'load',
		});

		// Parse each promise
		promiseEach(
			actions,
			action =>
				new Promise((fulfill, reject) => {
					switch (action.action) {
						case 'load':
							// Load icons
							app.reload(null, {
								logger: logger,
							})
								.then(() => {
									if (!Object.keys(app.collections).length) {
										reject('No collections were found.');
									} else {
										fulfill();
									}
								})
								.catch(err => {
									reject(
										'Error loading collections: ' +
											util.format(err)
									);
								});
							return;

						case 'sync':
							// Load icons
							app.sync(action.repo, {
								noDelay: true,
								reload: false,
								logger: logger,
							})
								.then(res => {
									fulfill();
								})
								.catch(err => {
									reject(
										'Error synchronizing repository "' +
											repo +
											'": ' +
											util.format(err)
									);
								});
							return;
					}
				})
		)
			.then(() => {
				logger.log(
					'\nStart up process completed in ' +
						(Date.now() - start) / 1000 +
						' seconds.'
				);
				fulfill();
			})
			.catch(err => {
				logger.error(
					'\nStart up process failed!\n\n' + util.format(err)
				);
				reject(err);
			});
	});
