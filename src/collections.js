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
     * @param {boolean} [log] Optional function for logging loading process
     */
    constructor(log) {
        this._log = typeof log === 'function' ? log : null;
        this.items = {};
        this._loadQueue = [];
    }

    /**
     * Add directory to loading queue
     *
     * @param {string} dir
     */
    addDirectory(dir) {
        this._loadQueue.push({
            type: 'dir',
            dir: dir.slice(-1) === '/' ? dir.slice(0, dir.length - 1) : dir
        });
    }

    /**
     * Add file to loading queue
     *
     * @param {string} filename
     */
    addFile(filename) {
        this._loadQueue.push({
            type: 'file',
            filename: filename
        });
    }

    /**
     * Load queue
     *
     * Promise will never reject because single file should not break app,
     * it will log failures using "log" function from constructor
     *
     * @returns {Promise}
     */
    load() {
        return new Promise((fulfill, reject) => {
            let promises = [];

            this._loadQueue.forEach(item => {
                switch (item.type) {
                    case 'dir':
                        promises.push(this._loadDir(item.dir));
                        break;

                    case 'file':
                        promises.push(this._loadFile(item.filename));
                        break;
                }
            });

            Promise.all(promises).then(() => {
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
     * @returns {Promise}
     * @private
     */
    _loadDir(dir) {
        return new Promise((fulfill, reject) => {
            fs.readdir(dir, (err, files) => {
                if (err) {
                    if (this._log !== null) {
                        this._log('Error loading directory: ' + dir);
                    }
                    fulfill(false);
                } else {
                    let promises = [];
                    files.forEach(file => {
                        if (file.slice(-5) !== '.json') {
                            return;
                        }
                        promises.push(this._loadFile(dir + '/' + file));
                    });

                    // Load all promises
                    Promise.all(promises).then(res => {
                        fulfill(true);
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
     * @returns {Promise}
     */
    _loadFile(filename) {
        return new Promise((fulfill, reject) => {
            let file = filename.split('/').pop(),
                fileParts = file.split('.');
            if (fileParts.length !== 2) {
                fulfill(false);
                return;
            }

            let prefix = fileParts[0],
                collection = new Collection(prefix);

            collection.loadFile(filename).then(() => {
                if (!collection.loaded) {
                    if (this._log !== null) {
                        this._log('Failed to load collection: ' + filename);
                    }
                    fulfill(false);
                    return;
                }

                if (collection.prefix !== prefix) {
                    if (this._log !== null) {
                        this._log('Collection prefix does not match: ' + collection.prefix + ' in file ' + file);
                    }
                    fulfill(false);
                    return;
                }

                let count = Object.keys(collection.icons).length;
                if (!count) {
                    if (this._log !== null) {
                        this._log('Collection is empty: ' + file);
                    }
                    fulfill(false);
                    return;
                }

                this.items[prefix] = collection;
                if (this._log !== null) {
                    this._log('Loaded collection ' + prefix + ' from ' + file + ' (' + count + ' icons)');
                }
                fulfill(true);
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
