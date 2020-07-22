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
const child_process = require('child_process');

const defaultOptions = {
	logger: null,
	noDelay: false,
	reload: true,
};

let active = Object.create(null),
	queued = Object.create(null);

class Sync {
	constructor(app, repo, options) {
		this.app = app;
		this.repo = repo;
		this.options = options;
	}

	sync() {
		return new Promise((fulfill, reject) => {
			this.app.log(
				'Synchronizing repository "' + this.repo + '"...',
				this.options
			);

			let time = Date.now(),
				root = this.app.dirs.storageDir(),
				targetDir = root + '/' + this.repo + '.' + time,
				repoURL = this.app.config.sync[this.repo],
				cmd = this.app.config.sync.git
					.replace('{target}', '"' + targetDir + '"')
					.replace('{repo}', '"' + repoURL + '"');

			child_process.exec(
				cmd,
				{
					cwd: root,
					env: process.env,
					uid: process.getuid(),
				},
				(error, stdout, stderr) => {
					if (error) {
						reject('Error executing git:' + util.format(error));
						return;
					}

					// Done. Set new directory and reload collections
					this.app.dirs.setSynchronizedRepoDir(this.repo, time, true);

					fulfill(true);
				}
			);
		});
	}

	/**
	 * Synchronize repository
	 *
	 * @param app
	 * @param repo
	 * @param options
	 * @param fulfill
	 * @param reject
	 */
	static sync(app, repo, options, fulfill, reject) {
		active[repo] = true;
		queued[repo] = false;

		let sync = new Sync(app, repo, options);
		sync.sync(fulfill, reject)
			.then(() => {
				active[repo] = false;
				if (queued[repo]) {
					// Retry
					let retryDelay;
					try {
						retryDelay = app.config.sync['repeated-sync-delay'];
					} catch (err) {
						retryDelay = 60;
					}
					app.log(
						'Repository "' +
							repo +
							'" has finished synchronizing, but there is another sync request queued. Will do another sync in ' +
							retryDelay +
							' seconds.',
						options
					);

					setTimeout(() => {
						Sync.sync(app, repo, options, fulfill, reject);
					}, retryDelay * 1000);
					return;
				}

				// Done
				app.log(
					'Completed synchronization of repository "' + repo + '".',
					options
				);
				if (options.reload && !queued[repo]) {
					app.reload(repo, options)
						.then(() => {
							fulfill(true);
						})
						.catch(err => {
							reject(err);
						});
				} else {
					fulfill(true);
				}
			})
			.catch(err => {
				reject(err);
			});
	}
}

module.exports = (app, repo, options) =>
	new Promise((fulfill, reject) => {
		// Options
		options = Object.assign(
			Object.create(null),
			defaultOptions,
			typeof options !== 'object' ? options : Object.create(null)
		);

		// Check if synchronization is disabled
		if (
			!app.config.canSync ||
			!app.config.sync[repo] ||
			!app.config.sync.git
		) {
			reject('Synchronization is disabled.');
			return;
		}

		// Check if repository sync is already in queue
		if (queued[repo]) {
			app.log(
				'Repository "' +
					repo +
					'" is already in synchronization queue.',
				options
			);
			fulfill(false);
			return;
		}

		let delay, retryDelay;
		try {
			delay = app.config.sync['sync-delay'];
			retryDelay = app.config.sync['repeated-sync-delay'];
		} catch (err) {
			delay = 60;
			retryDelay = 60;
		}
		if (options.noDelay) {
			delay = 0;
		}

		// Add to queue
		queued[repo] = true;

		// Check if repository is already being synchronized
		if (active[repo]) {
			app.log(
				'Repository "' +
					repo +
					'" is already being synchronized. Will do another sync ' +
					retryDelay +
					' seconds after previous sync completes.',
				options
			);
			fulfill(false);
			return;
		}

		// Create logger if its missing
		if (!options.logger) {
			options.logger = app.logger(
				'Synchronizing repository: ' + repo,
				delay + 15
			);
		}

		// Start time
		if (!delay) {
			Sync.sync(app, repo, options, fulfill, reject);
		} else {
			app.log(
				'Repository "' +
					repo +
					'" will start synchronizing in ' +
					delay +
					' seconds.',
				options
			);
			setTimeout(() => {
				Sync.sync(app, repo, options, fulfill, reject);
			}, delay * 1000);
		}
	});
