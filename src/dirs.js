"use strict";

let config, _dirs;

const functions = {
    /**
     * Get root directory of repository
     *
     * @param {string} repo
     * @returns {string}
     */
    rootDir: repo => _dirs[repo] === void 0 ? '' : _dirs[repo],

    /**
     * Get icons directory
     *
     * @param {string} repo
     * @returns {string}
     */
    iconsDir: repo => {
        let dir;

        switch (repo) {
            case 'simple-svg':
                dir = functions.rootDir(repo);
                return dir === '' ? '' : dir + '/json';

            case 'custom':
                return functions.rootDir(repo);
        }

        return '';
    },

    /**
     * Set root directory for repository
     *
     * @param repo
     * @param dir
     */
    setRootDir: (repo, dir) => {
        let extraKey = repo + '-dir';
        if (config[extraKey] !== void 0 && config[extraKey] !== '') {
            let extra = config[extraKey];
            if (extra.slice(0, 1) !== '/') {
                extra = '/' + extra;
            }
            if (extra.slice(-1) === '/') {
                extra = extra.slice(0, extra.length - 1);
            }
            dir += extra;
        }
        _dirs[repo] = dir;
    },

    /**
     * Get all repositories
     *
     * @returns {string[]}
     */
    keys: () => Object.keys(_dirs)
};

module.exports = appConfig => {
    config = appConfig;
    _dirs = {};

    // Set default directories
    if (config['serve-default-icons']) {
        let icons = require('simple-svg-icons');
        _dirs['simple-svg'] = icons.rootDir();
    }

    if (config['custom-icon-dir']) {
        _dirs['custom'] = config['custom-icon-dir'].replace('{dir}', config._dir);
    }

    config._dirs = functions;
    return functions;
};
