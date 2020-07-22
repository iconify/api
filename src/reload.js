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
const Collection = require('@iconify/json-tools').Collection;

const defaultOptions = {
	// Logger instance
	logger: null,
};

let repoItems = Object.create(null),
	collectionRepos = Object.create(null),
	hashes = Object.create(null),
	nextReload = 0;

class Loader {
	constructor(app, repos, options) {
		this.app = app;
		this.repos = repos;
		this.options = options;
		this.updated = [];
		this.start = Date.now();
		this.reloadInfo = false;
	}

	/**
	 * Remove root directory from filename
	 *
	 * @param {string} filename
	 * @return {string}
	 * @private
	 */
	_prettyFile(filename) {
		return filename.slice(0, this.app.root.length) === this.app.root
			? filename.slice(this.app.root.length + 1)
			: filename;
	}

	/**
	 * Find collections
	 *
	 * @return {Promise<Array>}
	 */
	findCollections() {
		return new Promise((fulfill, reject) => {
			promiseEach(
				this.repos,
				repo =>
					new Promise((fulfill, reject) => {
						// Get directory
						let dir = this.app.dirs.iconsDir(repo);
						if (dir === '') {
							reject(
								'Missing directory for repository "' +
									repo +
									'"'
							);
							return;
						}

						// Find all files
						fs.readdir(dir, (err, files) => {
							let items = [];
							if (err) {
								reject(
									'Error reading directory: ' +
										this._prettyFile(dir) +
										'\n' +
										util.format(err)
								);
								return;
							}
							files.forEach(file => {
								if (file.slice(-5) !== '.json') {
									return;
								}
								items.push({
									repo: repo,
									file: file,
									filename: dir + '/' + file,
									prefix: file.slice(0, file.length - 5),
								});
							});
							fulfill(items);
						});
					})
			)
				.then(results => {
					let items = [];

					results.forEach(result => {
						result.forEach(item => {
							if (collectionRepos[item.prefix] === void 0) {
								// New collection. Add it to list
								if (repoItems[item.repo] === void 0) {
									repoItems[item.repo] = [item.prefix];
								} else {
									repoItems[item.repo].push(item.prefix);
								}
								items.push(item);
								return;
							}

							if (collectionRepos[item.prefix] !== item.repo) {
								// Conflict: same prefix in multiple repositories
								this.app.error(
									'Collection "' +
										item.prefix +
										'" is found in multiple repositories. Ignoring json file from ' +
										item.repo +
										', using file from ' +
										collectionRepos[item.prefix],
									Object.assign(
										{
											key:
												'json-duplicate/' +
												item.repo +
												'/' +
												item.prefix,
										},
										this.options
									)
								);
								return;
							}

							// Everything is fine
							items.push(item);
						});
					});
					fulfill(items);
				})
				.catch(err => {
					reject(err);
				});
		});
	}

	/**
	 * Load collections
	 *
	 * @param {Array} items
	 * @return {Promise<any>}
	 */
	loadCollections(items) {
		return new Promise((fulfill, reject) => {
			let total;

			// Load all files
			promiseEach(
				items,
				item =>
					new Promise((fulfill, reject) => {
						let collection;

						// Load JSON file
						this.app
							.loadJSON(
								item.filename,
								hashes[item.prefix] === void 0
									? null
									: hashes[item.prefix]
							)
							.then(result => {
								if (!result.changed) {
									// Nothing to do
									fulfill(true);
									return;
								}

								return this.loadCollection(item, result);
							})
							.then(result => {
								collection = result;

								// Run post-load function if there is one
								if (this.app.postLoadCollection) {
									return this.app.postLoadCollection(
										collection,
										this.options
									);
								}
							})
							.then(() => {
								fulfill(collection);
							})
							.catch(err => {
								reject(
									'Error loading json file: ' +
										this._prettyFile(item.filename) +
										'\n' +
										util.format(err)
								);
							});
					})
			)
				.then(collections => {
					let loaded = 0,
						skipped = 0;

					total = 0;
					collections.forEach(collection => {
						if (collection === true) {
							skipped++;
							return;
						}
						loaded++;

						let count = Object.keys(collection.items.icons).length,
							prefix = collection.prefix();

						this.app.log(
							'Loaded collection ' +
								prefix +
								' from ' +
								collection.filename +
								' (' +
								count +
								' icons)',
							this.options
						);
						total += count;
						this.app.collections[prefix] = collection;
					});
					this.app.log(
						'Loaded ' +
							total +
							' icons from ' +
							loaded +
							(loaded > 1 ? ' collections ' : ' collection ') +
							(skipped
								? '(no changes in ' +
								  skipped +
								  (skipped > 1
										? ' collections) '
										: ' collection) ')
								: '') +
							'in ' +
							(Date.now() - this.start) / 1000 +
							' seconds.',
						this.options
					);

					if (this.reloadInfo) {
						return this.getCollectionsJSON();
					}
				})
				.then(() => {
					fulfill(total);
				})
				.catch(err => {
					reject(err);
				});
		});
	}

	/**
	 * Get Iconify collections data
	 *
	 * @return {Promise<any>}
	 */
	getCollectionsJSON() {
		return new Promise((fulfill, reject) => {
			let filename =
				this.app.dirs.rootDir('iconify') + '/collections.json';
			fs.readFile(filename, 'utf8', (err, data) => {
				if (err) {
					reject(
						'Error locating collections.json for Iconify default icons.\n' +
							util.format(err)
					);
					return;
				}

				try {
					data = JSON.parse(data);
				} catch (err) {
					reject(
						'Error reading contents of' +
							filename +
							'\n' +
							util.format(err)
					);
					return;
				}

				this.app.collectionsJSON = data;
				fulfill();
			});
		});
	}

	/**
	 * Load one collection
	 *
	 * @param {object} item findCollections() result
	 * @param {object} data loadJSON() result
	 * @return {Promise<Collection>}
	 */
	loadCollection(item, data) {
		return new Promise((fulfill, reject) => {
			let collection = new Collection();
			if (!collection.loadJSON(data.data, item.prefix)) {
				delete data.data;
				reject(
					'Error loading collection "' +
						item.prefix +
						'" from repository "' +
						item.repo +
						'": error parsing JSON'
				);
				return;
			}
			delete data.data;

			let prefix = collection.prefix();
			if (prefix !== item.prefix) {
				delete collection.items;
				reject(
					'Error loading collection "' +
						item.prefix +
						'" from repository "' +
						item.repo +
						'": invalid prefix in JSON file: ' +
						prefix
				);
				return;
			}

			collection.filename = this._prettyFile(item.filename);
			collection.repo = item.repo;
			hashes[item.prefix] = data.hash;
			this.updated.push(item.prefix);
			if (item.repo === 'iconify') {
				this.reloadInfo = true;
			}

			fulfill(collection);
		});
	}
}

/**
 * Reload collections
 *
 * @param {object} app
 * @param {Array|string|boolean} [repos] Repositories to reload
 * @param {object} [options]
 */
module.exports = (app, repos, options) =>
	new Promise((fulfill, reject) => {
		// Options
		options = Object.assign(
			Object.create(null),
			defaultOptions,
			typeof options === 'object' ? options : Object.create(null)
		);

		// Get list of repositories to reload
		let availableRepos = app.dirs.getRepos();
		// noinspection FallThroughInSwitchStatementJS
		switch (typeof repos) {
			case 'string':
				if (availableRepos.indexOf(repos) === -1) {
					reject('Cannot update repository: ' + repos);
					return;
				}
				repos = [repos];
				break;

			case 'object':
				if (repos instanceof Array) {
					let newList = [];
					repos.forEach(repo => {
						if (availableRepos.indexOf(repo) !== -1) {
							newList.push(repo);
						}
					});
					repos = newList;
					break;
				}

			case 'boolean':
				if (repos === false) {
					// false -> reload was called by /reload url
					// limit such reloads to 1 per 30 seconds
					if (Date.now() < nextReload) {
						fulfill(false);
						return;
					}
				}

			default:
				repos = availableRepos.slice(0);
		}

		if (!repos.length) {
			reject('No available repositories to update.');
			return;
		}

		if (app.reloading === true) {
			reject('Reload is already in progress.');
			return;
		}

		// Create logger if its missing
		if (!options.logger) {
			options.logger = app.logger('Loading repositories', 30);
		}

		// Create loader instance and do stuff
		let loader = new Loader(app, repos, options),
			count;

		app.reloading = true;
		loader
			.findCollections()
			.then(items => {
				return loader.loadCollections(items);
			})
			.then(total => {
				count = total;

				// Run post-load function if there is one
				if (app.postReload) {
					return app.postReload(loader.updated, options);
				}
			})
			.then(() => {
				// Do not allow /reload for 30 seconds
				nextReload = Date.now() + 30000;

				// Done
				fulfill({
					icons: count,
					updated: loader.updated,
				});
				app.reloading = false;
			})
			.catch(err => {
				reject(err);
				app.reloading = false;
			});
	});
