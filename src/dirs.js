/**
 * This file is part of the @iconify/api package.
 *
 * (c) Vjacheslav Trushkin <cyberalien@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

"use strict";

let config, _dirs;

let repos;

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
            case 'iconify':
                dir = functions.rootDir(repo);
                return dir === '' ? '' : dir + '/json';

            default:
                return functions.rootDir(repo);
        }
    },

    /**
     * Set root directory for repository
     *
     * @param repo
     * @param dir
     */
    setRootDir: (repo, dir) => {
        let extraKey = repo + '-dir';
        if (config.sync && config.sync[extraKey] !== void 0 && config.sync[extraKey] !== '') {
            let extra = config.sync[extraKey];
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
    keys: () => Object.keys(_dirs),

    /**
     * Get all repositories
     *
     * @returns {string[]}
     */
    getRepos: () => repos,
};

module.exports = appConfig => {
    config = appConfig;
    _dirs = {};
    repos = [];

    // Set default directories
    if (config['serve-default-icons']) {
        let icons = require('@iconify/json');
        repos.push('iconify');
        _dirs['iconify'] = icons.rootDir();
    }

    if (config['custom-icons-dir']) {
        repos.push('custom');
        _dirs['custom'] = config['custom-icons-dir'].replace('{dir}', config._dir);
    }

    config._dirs = functions;
    return functions;
};
