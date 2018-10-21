/**
 * This file is part of the @iconify/api package.
 *
 * (c) Vjacheslav Trushkin <cyberalien@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

"use strict";

const fs = require('fs');
const Collection = require('./collection');

/**
 * Class to represent collection of collections
 */
class Collections {
    /**
     * Constructor
     *
     * @param {object} config Application configuration
     */
    constructor(config) {
        this._config = config;

        this.items = {};
        this._loadQueue = [];
    }

    /**
     * Add directory to loading queue
     *
     * @param {string} dir
     * @param {string} repo
     */
    addDirectory(dir, repo) {
        console.log('Loading collections for repository "' + repo + '" from directory:', dir);
        this._loadQueue.push({
            type: 'dir',
            dir: dir.slice(-1) === '/' ? dir.slice(0, dir.length - 1) : dir,
            repo: repo
        });
    }

    /**
     * Add file to loading queue
     *
     * @param {string} filename
     * @param {string} repo
     */
    addFile(filename, repo) {
        this._loadQueue.push({
            type: 'file',
            filename: filename,
            repo: repo
        });
    }

    /**
     * Find collections
     *
     * @private
     */
    _findCollections(repo) {
        return new Promise((fulfill, reject) => {
            let config = this._config,
                dirs = config._dirs,
                iconsDir = dirs.iconsDir(repo);

            if (iconsDir === '') {
                // Nothing to add
                fulfill();
                return;
            }

            switch (repo) {
                case 'iconify':
                    // Get collections.json
                    let filename = dirs.rootDir(repo) + '/collections.json';
                    fs.readFile(filename, 'utf8', (err, data) => {
                        if (err) {
                            reject('Error locating collections.json for Iconify default icons.');
                            return;
                        }

                        try {
                            data = JSON.parse(data);
                        } catch (err) {
                            reject('Error reading contents of' + filename);
                            return;
                        }

                        this.addDirectory(iconsDir, repo);
                        this.info = data;

                        fulfill();
                    });
                    return;

                default:
                    this.addDirectory(iconsDir, repo);
                    fulfill();
            }
        });
    }

    /**
     * Find all collections and loadQueue
     *
     * @returns {Promise}
     */
    reload(repos) {
        return new Promise((fulfill, reject) => {
            let promises = repos.map(repo => this._findCollections(repo));

            Promise.all(promises).then(() => {
                return this.loadQueue();
            }).then(() => {
                fulfill(this);
            }).catch(err => {
                reject(err);
            })
        });
    }

    /**
     * Load only one repository
     *
     * @param {string} repo Repository name
     * @returns {Promise}
     */
    loadRepo(repo) {
        return new Promise((fulfill, reject) => {
            Promise.all(this._findCollections(repo)).then(() => {
                return this.loadQueue();
            }).then(() => {
                fulfill(this);
            }).catch(err => {
                reject(err);
            })
        });
    }

    /**
     * Load queue
     *
     * Promise will never reject because single file should not break app,
     * it will log failures instead
     *
     * @returns {Promise}
     */
    loadQueue() {
        return new Promise((fulfill, reject) => {
            let promises = [];

            this._loadQueue.forEach(item => {
                switch (item.type) {
                    case 'dir':
                        promises.push(this._loadDir(item.dir, item.repo));
                        break;

                    case 'file':
                        promises.push(this._loadFile(item.filename, item.repo));
                        break;
                }
            });

            Promise.all(promises).then(res => {
                let total = 0;
                res.forEach(count => {
                    if (typeof count === 'number') {
                        total += count;
                    }
                });
                console.log('Loaded ' + total + ' icons');
                fulfill(this);
            }).catch(err => {
                reject(err);
            });
        });
    }

    /**
     * Load directory
     *
     * @param {string} dir
     * @param {string} repo
     * @returns {Promise}
     * @private
     */
    _loadDir(dir, repo) {
        return new Promise((fulfill, reject) => {
            fs.readdir(dir, (err, files) => {
                if (err) {
                    this._config.log('Error reading directory: ' + dir + '\n' + util.format(err), 'collections-' + dir, true);
                    fulfill(false);
                } else {
                    let promises = [];
                    files.forEach(file => {
                        if (file.slice(-5) !== '.json') {
                            return;
                        }
                        promises.push(this._loadFile(dir + '/' + file, repo));
                    });

                    // Load all promises
                    Promise.all(promises).then(res => {
                        let total = 0;
                        res.forEach(count => {
                            if (typeof count === 'number') {
                                total += count;
                            }
                        });
                        fulfill(total);
                    }).catch(err => {
                        fulfill(false);
                    });
                }
            });
        });
    }

    /**
     * Load file
     *
     * @param {string} filename Full filename
     * @param {string} repo
     * @returns {Promise}
     */
    _loadFile(filename, repo) {
        return new Promise((fulfill, reject) => {
            let file = filename.split('/').pop(),
                fileParts = file.split('.');
            if (fileParts.length !== 2) {
                fulfill(false);
                return;
            }

            let prefix = fileParts[0],
                collection = new Collection(prefix);

            collection.repo = repo;
            collection.loadFile(filename, prefix).then(result => {
                collection = result;
                if (!collection.loaded) {
                    this._config.log('Failed to load collection: ' + filename, 'collection-load-' + filename, true);
                    fulfill(false);
                    return;
                }

                if (collection.prefix !== prefix) {
                    this._config.log('Collection prefix does not match: ' + collection.prefix + ' in file ' + filename, 'collection-prefix-' + filename, true);
                    fulfill(false);
                    return;
                }

                let count = Object.keys(collection.icons).length;
                if (!count) {
                    this._config.log('Collection is empty: ' + filename, 'collection-empty-' + filename, true);
                    fulfill(false);
                    return;
                }

                this.items[prefix] = collection;
                console.log('Loaded collection ' + prefix + ' from ' + file + ' (' + count + ' icons)');
                fulfill(count);
            }).catch(() => {
                fulfill(false);
            });
        });
    }

    /**
     * Find collection
     *
     * @param {string} prefix
     * @returns {Collection|null}
     */
    find(prefix) {
        return this.items[prefix] === void 0 ? null : this.items[prefix];
    }
}

module.exports = Collections;
