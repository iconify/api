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
const { dirname } = require('path');

/**
 * Directories storage.
 * This module is responsible for storing and updating locations of collections
 *
 * @param app
 * @returns {object}
 */
module.exports = (app) => {
	let functions = Object.create(null),
		dirs = Object.create(null),
		custom = Object.create(null),
		repos = [],
		storageDir = null,
		versionsFile = null;

	/**
	 * Get root directory of repository
	 *
	 * @param {string} repo
	 * @returns {string}
	 */
	functions.rootDir = (repo) => (dirs[repo] === void 0 ? '' : dirs[repo]);

	/**
	 * Get storage directory
	 *
	 * @return {string}
	 */
	functions.storageDir = () => storageDir;

	/**
	 * Get icons directory
	 *
	 * @param {string} repo
	 * @returns {string}
	 */
	functions.iconsDir = (repo) => {
		let dir;

		switch (repo) {
			case 'iconify':
				dir = functions.rootDir(repo);
				return dir === '' ? '' : dir + '/json';

			default:
				return functions.rootDir(repo);
		}
	};

	/**
	 * Set root directory for repository
	 *
	 * @param {string} repo
	 * @param {string} dir
	 */
	functions.setRootDir = (repo, dir) => {
		// Append additional directory from config
		let extra;
		try {
			extra = app.config.sync[repo + '-dir'];
		} catch (err) {
			extra = '';
		}

		if (extra !== void 0 && extra !== '') {
			if (extra.slice(0, 1) !== '/') {
				extra = '/' + extra;
			}
			if (extra.slice(-1) === '/') {
				extra = extra.slice(0, extra.length - 1);
			}
			dir += extra;
		}

		// Set directory
		dirs[repo] = dir;
	};

	/**
	 * Set root directory for repository using repository time
	 *
	 * @param {string} repo
	 * @param {number} time
	 * @param {boolean} [save] True if new versions.json should be saved
	 */
	functions.setSynchronizedRepoDir = (repo, time, save) => {
		let dir = storageDir + '/' + repo + '.' + time;
		custom[repo] = time;
		functions.setRootDir(repo, dir);
		if (save === true) {
			fs.writeFileSync(
				versionsFile,
				JSON.stringify(custom, null, 4),
				'utf8'
			);
		}
	};

	/**
	 * Get all repositories
	 *
	 * @returns {string[]}
	 */
	functions.keys = () => Object.keys(dirs);

	/**
	 * Get all repositories
	 *
	 * @returns {string[]}
	 */
	functions.getRepos = () => repos;

	/**
	 * Check if repository has been synchronized
	 *
	 * @param {string} repo
	 * @return {boolean}
	 */
	functions.synchronized = (repo) => custom[repo] === true;

	/**
	 * Initialize
	 */

	// Get synchronized repositories
	let cached = Object.create(null);
	app.config.canSync = false;
	try {
		if (app.config.sync.versions && app.config.sync.storage) {
			// Set storage directory and versions.json location
			storageDir = app.config.sync.storage.replace('{dir}', app.root);
			versionsFile = app.config.sync.versions.replace('{dir}', app.root);
			app.config.canSync = true;

			// Try getting latest repositories
			cached = fs.readFileSync(versionsFile, 'utf8');
			cached = JSON.parse(cached);
		}
	} catch (err) {
		if (typeof cached !== 'object') {
			cached = Object.create(null);
		}
	}

	if (storageDir !== null) {
		try {
			fs.mkdirSync(storageDir);
		} catch (err) {}
	}

	// Set default directories
	if (app.config['serve-default-icons']) {
		let key = 'iconify';
		if (cached && cached[key]) {
			repos.push(key);
			functions.setSynchronizedRepoDir(key, cached[key], false);
		} else {
			try {
				const iconDir = dirname(
					require.resolve('@iconify/json/package.json')
				);
				repos.push(key);
				dirs[key] = iconDir;
			} catch (err) {
				app.error(
					'Cannot load Iconify icons because @iconify/json package is not installed'
				);
			}
		}
	}

	if (app.config['custom-icons-dir']) {
		let key = 'custom';
		repos.push(key);
		if (cached[key]) {
			functions.setSynchronizedRepoDir(key, cached[key], false);
		} else {
			dirs[key] = app.config['custom-icons-dir'].replace(
				'{dir}',
				app.root
			);
		}
	}

	return functions;
};
