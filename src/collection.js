"use strict";

const fs = require('fs');

const defaultAttributes = {
    left: 0,
    top: 0,
    width: 16,
    height: 16,
    rotate: 0,
    hFlip: false,
    vFlip: false
};

let cache = {};

/**
 * Class to represent one collection of icons
 */
class Collection {
    /**
     * Constructor
     *
     * @param {string} [prefix] Optional prefix
     */
    constructor(prefix) {
        this.prefix = typeof prefix === 'string' ? prefix : null;
        this.loaded = false;
    }

    /**
     * Load from JSON data
     *
     * @param {string|object} data
     */
    loadJSON(data) {
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (err) {
                return;
            }
        }

        // Validate
        if (typeof data !== 'object' || data.icons === void 0) {
            return;
        }

        /** @var {{icons, aliases, prefix}} data **/

        // DeOptimize
        Object.keys(data).forEach(prop => {
            switch (typeof data[prop]) {
                case 'number':
                case 'boolean':
                    let value = data[prop];
                    Object.keys(data.icons).forEach(key => {
                        if (data.icons[key][prop] === void 0) {
                            data.icons[key][prop] = value;
                        }
                    });
                    delete data[prop];
            }
        });

        // Remove prefix from icons
        if (data.prefix === void 0 || data.prefix === '') {
            if (this.prefix === null) {
                return;
            }
            let error = false,
                sliceLength = this.prefix.length + 1;

            ['icons', 'aliases'].forEach(prop => {
                if (error || data[prop] === void 0) {
                    return;
                }
                let newItems = {};
                Object.keys(data[prop]).forEach(key => {
                    if (error || key.length <= sliceLength || key.slice(0, this.prefix.length) !== this.prefix) {
                        error = true;
                        return;
                    }
                    let newKey = key.slice(sliceLength);
                    if (data[prop][key].parent !== void 0) {
                        let parent = data[prop][key].parent;
                        if (parent.length <= sliceLength || parent.slice(0, this.prefix.length) !== this.prefix) {
                            error = true;
                            return;
                        }
                        data[prop][key].parent = parent.slice(sliceLength);
                    }
                    newItems[newKey] = data[prop][key];
                });
                data[prop] = newItems;
            });
            if (error) {
                return;
            }
        } else {
            this.prefix = data.prefix;
        }

        // Add aliases and icons
        this.icons = data.icons;
        this.aliases = data.aliases === void 0 ? {} : data.aliases;

        // Add characters and categories
        if (data.chars !== void 0) {
            this.chars = data.chars;
        }
        if (data.categories !== void 0) {
            this.categories = data.categories;
        }

        this.loaded = true;
    }

    /**
     * Load collection from file
     *
     * @param {string} file File or JSON
     * @param {string} [defaultPrefix]
     * @returns {Promise}
     */
    loadFile(file, defaultPrefix) {
        return new Promise((fulfill, reject) => {
            // Load file
            fs.readFile(file, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    let checkCache = typeof defaultPrefix === 'string';

                    // Check cache
                    if (checkCache && cache[defaultPrefix] !== void 0 && cache[defaultPrefix].length === file.length) {
                        // If JSON file has same length, assume its the same file. Do not bother with hashing
                        fulfill(cache[defaultPrefix].collection);
                        return;
                    }

                    this.loadJSON(data);
                    if (this.loaded) {
                        if (checkCache) {
                            cache[defaultPrefix] = {
                                length: file.length,
                                collection: this
                            };
                        }
                        fulfill(this);
                    } else {
                        reject();
                    }
                }
            });
        });
    }

    // Functions used by getIcons()
    /**
     * Check if icon has already been copied
     *
     * @param {string} name
     * @returns {boolean}
     * @private
     */
    _copied(name) {
        return !!(this._result.icons[name] || this._result.aliases[name]);
    }

    /**
     * Copy icon
     *
     * @param {string} name
     * @param {number} iteration
     * @returns {boolean}
     * @private
     */
    _copy(name, iteration) {
        if (this._copied(name) || iteration > 5) {
            return true;
        }
        if (this.icons[name] !== void 0) {
            this._result.icons[name] = this.icons[name];
            return true;
        }
        if (this.aliases && this.aliases[name] !== void 0) {
            if (!this._copy(this.aliases[name].parent, iteration + 1)) {
                return false;
            }
            this._result.aliases[name] = this.aliases[name];
            return true;
        }
        return false;
    }

    /**
     * Get data for selected icons
     * This function assumes collection has been loaded. Verification should be done during loading
     *
     * @param {Array} icons
     * @returns {{icons: {}, aliases: {}}}
     */
    getIcons(icons) {
        this._result = {
            prefix: this.prefix,
            icons: {},
            aliases: {}
        };

        icons.forEach(icon => this._copy(icon, 0));
        return this._result;
    }

    // Functions used by getIcon()
    /**
     * Merge icon data with this._result
     *
     * @param {object} data
     * @private
     */
    _mergeIcon(data) {
        Object.keys(data).forEach(key => {
            if (this._result[key] === void 0) {
                this._result[key] = data[key];
                return;
            }
            // Merge transformations, ignore the rest because alias overwrites parent items's attributes
            switch (key) {
                case 'rotate':
                    this._result.rotate += data.rotate;
                    break;

                case 'hFlip':
                case 'vFlip':
                    this._result[key] = this._result[key] !== data[key];
            }
        });
    }

    /**
     * Add missing properties to object
     *
     * @param {object} data
     * @returns {object}
     * @private
     */
    static _addMissingAttributes(data) {
        let item = Object.assign({}, defaultAttributes, data);
        if (item.inlineTop === void 0) {
            item.inlineTop = item.top;
        }
        if (item.inlineHeight === void 0) {
            item.inlineHeight = item.height;
        }
        if (item.verticalAlign === void 0) {
            // -0.143 if icon is designed for 14px height,
            // otherwise assume icon is designed for 16px height
            item.verticalAlign = item.height % 7 === 0 && item.height % 8 !== 0 ? -0.143 : -0.125;
        }
        return item;
    }

    /**
     * Get icon data for SVG
     * This function assumes collection has been loaded. Verification should be done during loading
     *
     * @param {string} name
     * @returns {object|null}
     */
    getIcon(name) {
        if (this.icons[name] !== void 0) {
            return Collection._addMissingAttributes(this.icons[name]);
        }

        // Alias
        if (this.aliases[name] === void 0) {
            return null;
        }
        this._result = Object.assign({}, this.aliases[name]);

        let parent = this.aliases[name].parent,
            iteration = 0;

        while (iteration < 5) {
            if (this.icons[parent] !== void 0) {
                // Merge with icon
                this._mergeIcon(this.icons[parent]);
                return Collection._addMissingAttributes(this._result);
            }

            if (this.aliases[parent] === void 0) {
                return null;
            }
            this._mergeIcon(this.aliases[parent]);
            parent = this.aliases[parent].parent;
            iteration ++;
        }
        return null;
    }
}

module.exports = Collection;