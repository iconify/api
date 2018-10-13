"use strict";

const fs = require('fs'),
    child_process = require('child_process'),
    promiseQueue = require('./promise');

let synchronized = {},
    active = false,
    cleaning = false,
    synchronizing = {},
    reSync = {},
    syncQueue = {};

let config, dirs, repos, _baseDir, _repoDir, _versionsFile;

/**
 * Start synchronization
 *
 * @param repo
 */
const startSync = repo => {
    if (syncQueue[repo] === void 0) {
        return;
    }

    function done(success) {
        if (success) {
            console.log('Saved latest version of repository "' + repo + '" to', targetDir);
            synchronized[repo] = t;
            functions.saveVersions();
            dirs.setRootDir(repo, targetDir);
            setTimeout(functions.cleanup, 300000);
        }
        synchronizing[repo] = false;

        syncQueue[repo].forEach((done, index) => {
            if (index > 0) {
                // Send false to all promises except first one to avoid loading collections several times
                done(false);
            } else {
                done(success);
            }
        });
    }

    console.log('Synchronizing repository "' + repo + '" ...');
    synchronizing[repo] = true;

    let t = Date.now(),
        targetDir = _baseDir + '/' + repo + '.' + t,
        repoURL = config.sync[repo],
        cmd = config.sync.git.replace('{target}', '"' + targetDir + '"').replace('{repo}', '"' + repoURL + '"');

    reSync[repo] = false;
    child_process.exec(cmd, {
        cwd: _baseDir,
        env: process.env,
        uid: process.getuid()
    }, (error, stdout, stderr) => {
        if (error) {
            config.log('Error executing git:' + util.format(error), cmd, true);
            done(false);
            return;
        }

        if (reSync[repo]) {
            // Another sync event was asked while cloning repository. Do it again
            startSync(repo);
            return;
        }

        done(true);
    });
};

/**
 * Remove file
 *
 * @param {string} file
 * @returns {Promise<any>}
 */
const removeFile = file => new Promise((fulfill, reject) => {
    fs.unlink(file, err => {
        if (err) {
            config.log('Error deleting file ' + file, file, false);
        }
        fulfill();
    })
});

/**
 * Remove directory with sub-directories and files
 *
 * @param {string} dir
 * @returns {Promise<any>}
 */
const removeDir = dir => new Promise((fulfill, reject) => {
    function done() {
        fs.rmdir(dir, err => {
            config.log('Error deleting directory ' + dir, dir, false);
            fulfill();
        });
    }

    fs.readdir(dir, (err, files) => {
        if (err) {
            // fulfill instead of rejecting
            fulfill();
            return;
        }

        let children = {};

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

        promiseQueue(Object.keys(children), file => {
            if (children[file]) {
                return removeDir(file);
            } else {
                return removeFile(file);
            }
        }).then(() => {
            done();
        }).catch(err => {
            config.log('Error recursively removing directory ' + dir + '\n' + util.format(err), 'rmdir-' + dir, true);
            done();
        });
    });
});

/**
 * Exported functions
 *
 * @type {object}
 */
const functions = {
    /**
     * Get root directory of repository
     *
     * @param {string} repo
     * @returns {string|null}
     */
    root: repo => synchronized[repo] ? _baseDir + '/' + repo + '.' + synchronized[repo] : null,

    /**
     * Check if repository can be synchronized
     *
     * @param {string} repo
     * @returns {boolean}
     */
    canSync: repo => active && synchronized[repo] !== void 0,

    /**
     * Get last synchronization time
     *
     * @param {string} repo
     * @returns {number}
     */
    time: repo => active && synchronized[repo] !== void 0 ? synchronized[repo] : 0,

    /**
     * Check if key is valid
     *
     * @param {string} key
     * @returns {boolean}
     */
    validKey: key => typeof key === 'string' && key.length && key === config.sync.secret,

    /**
     * Save versions.json
     */
    saveVersions: () => {
        let data = {};
        Object.keys(synchronized).forEach(repo => {
            if (synchronized[repo]) {
                data[repo] = synchronized[repo];
            }
        });

        fs.writeFile(_versionsFile, JSON.stringify(data, null, 4), 'utf8', err => {
            if (err) {
                config.error('Error saving versions.json\n' + util.format(err), 'version-' + _versionsFile, true);
            }
        });
    },

    /**
     * Synchronize repository
     *
     * @param {string} repo
     * @param {boolean} [immediate]
     * @returns {Promise<any>}
     */
    sync: (repo, immediate) => new Promise((fulfill, reject) => {
        let finished = false,
            attempts = 0;

        function done(loadCollections) {
            if (finished) {
                return;
            }

            finished = true;
            fulfill(loadCollections);
        }

        function nextAttempt() {
            if (finished) {
                return;
            }

            if (synchronizing[repo]) {
                // Another repository is still being synchronized?
                console.log('Cannot start repository synchronization because sync is already in progress.');
                attempts ++;
                if (attempts > 3) {
                    done(false);
                } else {
                    setTimeout(nextAttempt, config.sync['repeated-sync-delay'] * 1000);
                }
                return;
            }

            // Start synchronizing
            startSync(repo);
        }

        if (!active) {
            reject('Cannot synchronize repositories.');
            return;
        }

        // Add to queue
        reSync[repo] = true;
        if (syncQueue[repo] === void 0) {
            syncQueue[repo] = [done];
        } else {
            syncQueue[repo].push(done);
        }

        if (synchronizing[repo]) {
            // Wait until previous sync operation is over
            setTimeout(nextAttempt, config.sync['repeated-sync-delay'] * 1000);
            attempts ++;
        } else if (immediate === true) {
            // Start immediately
            nextAttempt();
        } else {
            // Wait a bit to avoid multiple synchronizations
            setTimeout(nextAttempt, config.sync['sync-delay'] * 1000);
        }
    }),

    /**
     * Remove old files
     */
    cleanup: () => {
        if (cleaning) {
            return;
        }
        cleaning = true;

        fs.readdir(_baseDir, (err, files) => {
            if (err) {
                cleaning = false;
                return;
            }

            let dirs = [];
            files.forEach(file => {
                let parts = file.split('.');
                if (parts.length !== 2 || synchronized[parts[0]] === void 0) {
                    return;
                }

                let repo = parts.shift(),
                    time = parseInt(parts.shift());

                if (time > (synchronized[repo] - 3600 * 1000)) {
                    // wait 1 hour before deleting old repository
                    return;
                }

                dirs.push(_baseDir + '/' + file);
            });

            if (!dirs.length) {
                cleaning = false;
                return;
            }

            console.log('Cleaning up old repositories...');

            // Delete all directories, but only 1 at a time to reduce loadQueue
            promiseQueue(dirs, dir => removeDir(dir)).then(() => {
                cleaning = false;
            }).catch(err => {
                config.log('Error cleaning up old files:\n' + util.format(err), 'cleanup', true);
                cleaning = false;
            });
        });
    }
};

/**
 * Initialize. Find active repositories
 */
function init() {
    if (!config.sync || !config.sync.versions || !config.sync.storage) {
        // Synchronization is inactive
        return;
    }

    if (!config.sync.secret) {
        // Cannot sync without secret word
        console.log('Repositories synchronization is not possible because "secret" is empty. Check config.md for details.');
        return;
    }

    // Check active repositories
    repos.forEach(repo => {
        if (!config.sync[repo]) {
            return;
        }

        synchronized[repo] = 0;
        synchronizing[repo] = false;
    });

    if (!Object.keys(synchronized).length) {
        // Nothing was found
        console.log('Repositories synchronization is not possible because no active repositories were found. Check config.md for details.');
        return;
    }

    // Try to create base directory
    _baseDir = config.sync.storage.replace('{dir}', config._dir);
    try {
        fs.mkdirSync(_baseDir);
    } catch (err) {
    }

    // Check for versions.json
    _versionsFile = config.sync.versions.replace('{dir}', config._dir);
    active = true;

    let data;
    try {
        data = fs.readFileSync(_versionsFile, 'utf8');
        data = JSON.parse(data);
    } catch (err) {
        // Nothing to parse
        return;
    }

    Object.keys(data).forEach(key => {
        let dir;

        if (synchronized[key] === void 0) {
            return;
        }

        dir = _baseDir + '/' + key + '.' + data[key];
        try {
            let stat = fs.lstatSync(dir);
            if (stat && stat.isDirectory()) {
                // Found directory
                synchronized[key] = data[key];
                dirs.setRootDir(key, dir);
                console.log('Icons will be loaded from ' + dir + ' instead of default location.');
                return;
            }
        } catch (err) {
        }

        config.log('Error loading latest collections: directory does not exist: ' + dir, 'missing-' + dir, true);
    });
    setTimeout(functions.cleanup, 60000);
}

module.exports = appConfig => {
    config = appConfig;
    dirs = config._dirs;
    repos = dirs.getRepos();
    init();

    config._sync = functions;
    return functions;
};
