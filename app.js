/**
 * Main file to run in Node.js
 */
"use strict";

/*
 *  Main stuff
 */
const fs = require('fs'),
    // Express stuff
    express = require('express'),
    app = express(),

    // Configuration and version
    version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version,

    // Included files
    Collections = require('./src/collections'),

    // Query parser
    parseQuery = require('./src/query');

// Configuration
let config = JSON.parse(fs.readFileSync(__dirname + '/config-default.json', 'utf8'));

try {
    let customConfig = fs.readFileSync(__dirname + '/config.json', 'utf8');
    if (typeof customConfig === 'string') {
        customConfig = JSON.parse(customConfig);
        Object.keys(customConfig).forEach(key => {
            if (typeof config[key] !== typeof customConfig[key]) {
                return;
            }

            if (typeof config[key] === 'object') {
                // merge object
                Object.assign(config[key], customConfig[key]);
            } else {
                // overwrite scalar variables
                config[key] = customConfig[key];
            }
        });
    }
} catch (err) {
}
config._dir = __dirname;

// Enable logging module
require('./src/log')(config);

// Port
if (config['env-port'] && process.env.PORT) {
    config.port = process.env.PORT;
}

// Region file to easy identify server in CDN
if (!config['env-region'] && process.env.region) {
    config.region = process.env.region;
}
if (config.region.length > 10 || !config.region.match(/^[a-z0-9_-]+$/i)) {
    config.region = '';
    config.log('Invalid value for region config variable.', 'config-region', true);
}

// Reload secret key
if (config['reload-secret'] === '') {
    // Add reload-secret to config.json to be able to run /reload?key=your-secret-key that will reload collections without restarting server
    console.log('reload-secret configuration is empty. You will not be able to update all collections without restarting server.');
}

// Collections list
let collections = null,
    loading = true,
    anotherReload = false;

// Modules
let dirs = require('./src/dirs')(config),
    sync = require('./src/sync')(config);

/**
 * Load icons
 *
 * @param {boolean} firstLoad
 * @returns {Promise}
 */
function loadIcons(firstLoad) {
    return new Promise((fulfill, reject) => {
        function getCollections() {
            let t = Date.now(),
                newCollections = new Collections(config);

            console.log('Loading collections at ' + (new Date()).toString());
            newCollections.reload(dirs.getRepos()).then(() => {
                console.log('Loaded in ' + (Date.now() - t) + 'ms');
                fulfill(newCollections);
            }).catch(err => {
                reject(err);
            });
        }

        if (firstLoad && config.sync && config.sync['sync-on-startup']) {
            // Synchronize repositories first
            let promises = [];
            dirs.keys().forEach(repo => {
                if (sync.canSync(repo)) {
                    switch (config.sync['sync-on-startup']) {
                        case 'always':
                            break;

                        case 'never':
                            return;

                        case 'missing':
                            // Check if repository is missing
                            if (sync.time(repo)) {
                                return;
                            }
                    }
                    promises.push(sync.sync(repo, true));
                }
            });

            if (promises.length) {
                console.log('Synchronizing repositories before starting...');
            }
            Promise.all(promises).then(() => {
                getCollections();
            }).catch(err => {
                console.log(err);
                getCollections();
            });
        } else {
            getCollections();
        }
    });
}

function reloadIcons(firstLoad) {
    loading = true;
    anotherReload = false;
    loadIcons(false).then(newCollections => {
        collections = newCollections;
        loading = false;
        if (anotherReload) {
            reloadIcons(false);
        }
    }).catch(err => {
        config.log('Fatal error loading collections:\n' + util.format(err), null, true);
        loading = false;
        if (anotherReload) {
            reloadIcons(false);
        }
    });
}

/**
 * Send cache headers
 *
 * @param req
 * @param res
 */
function cacheHeaders(req, res) {
    if (
        config.cache && config.cache.timeout &&
        (req.get('Pragma') === void 0 || req.get('Pragma').indexOf('no-cache') === -1) &&
        (req.get('Cache-Control') === void 0 || req.get('Cache-Control').indexOf('no-cache') === -1)
    ) {
        res.set('Cache-Control', (config.cache.private ? 'private' : 'public') + ', max-age=' + config.cache.timeout + ', min-refresh=' + config.cache['min-refresh']);
        if (!config.cache.private) {
            res.set('Pragma', 'cache');
        }
    }
}

/**
 * Send result object generated by query parser
 *
 * @param {object} result
 * @param req
 * @param res
 */
function sendResult(result, req, res) {
    if (typeof result === 'number') {
        res.sendStatus(result);
        return;
    }

    // Send cache header
    cacheHeaders(req, res);

    // Check for download
    if (result.filename !== void 0 && (req.query.download === '1' || req.query.download === 'true')) {
        res.set('Content-Disposition', 'attachment; filename="' + result.filename + '"');
    }

    // Send data
    res.type(result.type).send(result.body);
}

/**
 * Delay response
 *
 * @param {function} callback
 * @param res
 */
function delayResponse(callback, res) {
    // Attempt to parse query every 250ms for up to 10 seconds
    let attempts = 0,
        timer = setInterval(function() {
            attempts ++;
            if (collections === null) {
                if (attempts > 40) {
                    clearInterval(timer);
                    res.sendStatus(503);
                }
            } else {
                clearInterval(timer);
                callback();
            }
        }, 250);
}

/**
 * Parse request
 *
 * @param {string} prefix
 * @param {string} query
 * @param {string} ext
 * @param {object} req
 * @param {object} res
 */
function parseRequest(prefix, query, ext, req, res) {
    function parse() {
        let result = 404,
            collection = collections.find(prefix);

        if (collection !== null) {
            result = parseQuery(collection, query, ext, req.query);
        }

        sendResult(result, req, res);
    }

    // Parse query
    if (collections === null) {
        // This means script is still loading
        delayResponse(parse, res);
    } else {
        parse();
    }
}

// Load icons
loadIcons(true).then(newCollections => {
    collections = newCollections;
    loading = false;
    if (anotherReload) {
        anotherReload = false;
        setTimeout(() => {
            reloadIcons(false);
        }, 30000);
    }
}).catch(err => {
    config.log('Fatal error loading collections:\n' + util.format(err), null, true);
    loading = false;
    reloadIcons(true);
});

// Disable X-Powered-By header
app.disable('x-powered-by');

// CORS
app.options('/*', (req, res) => {
    if (config.cors) {
        res.header('Access-Control-Allow-Origin', config.cors.origins);
        res.header('Access-Control-Allow-Methods', config.cors.methods);
        res.header('Access-Control-Allow-Headers', config.cors.headers);
        res.header('Access-Control-Max-Age', config.cors.timeout);
    }
    res.send(200);
});

// GET 3 part request
app.get(/^\/([a-z0-9-]+)\/([a-z0-9-]+)\.(js|json|svg)$/, (req, res) => {
    // prefix/icon.svg
    // prefix/icons.json
    parseRequest(req.params[0], req.params[1], req.params[2], req, res);
});

// GET 2 part JS/JSON request
app.get(/^\/([a-z0-9-]+)\.(js|json)$/, (req, res) => {
    // prefix.json
    parseRequest(req.params[0], 'icons', req.params[1], req, res);
});

// GET 2 part SVG request
app.get(/^\/([a-z0-9:-]+)\.svg$/, (req, res) => {
    let parts = req.params[0].split(':');

    if (parts.length === 2) {
        // prefix:icon.svg
        parseRequest(parts[0], parts[1], 'svg', req, res);
        return;
    }

    if (parts.length === 1) {
        parts = parts[0].split('-');
        if (parts.length > 1) {
            // prefix-icon.svg
            parseRequest(parts.shift(), parts.join('-'), 'svg', req, res);
            return;
        }
    }

    res.sendStatus(404);
});

// Disable crawling
app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send('User-agent: *\nDisallow: /');
});

// Debug information and AWS health check
app.get('/version', (req, res) => {
    let body = 'Iconify API version ' + version + ' (Node';
    if (config.region.length) {
        body += ', ' + config.region;
    }
    body += ')';
    res.send(body);
});

// Reload collections without restarting app
app.get('/reload', (req, res) => {
    if (config['reload-secret'].length && req.query && req.query.key && req.query.key === config['reload-secret']) {
        // Reload collections
        process.nextTick(() => {
            if (loading) {
                anotherReload = true;
                return;
            }
            reloadIcons(false);
        });
    }

    // Send 200 response regardless of reload status, so visitor would not know if secret key was correct
    // Testing should be done by checking new icons that should have been added by reload
    res.sendStatus(200);
});

// Update collection without restarting app
app.get('/sync', (req, res) => {
    let repo = req.query.repo;

    if (sync.canSync(repo) && sync.validKey(req.query.key)) {
        if (config.sync['sync-delay']) {
            console.log('Will start synchronizing repository "' + repo + '" in up to ' + config.sync['sync-delay'] + ' seconds...');
        }
        sync.sync(repo, false).then(canLoad => {
            if (canLoad) {
                // Refresh all icons
                if (loading) {
                    anotherReload = true;
                } else {
                    reloadIcons(false);
                }
            }
        }).catch(err => {
            config.log('Error synchronizing repository "' + repo + '":\n' + util.format(err), 'sync-' + repo, true);
        });
    }

    // Send 200 response regardless of reload status, so visitor would not know if secret key was correct
    // Testing should be done by checking new icons that should have been added by reload
    res.sendStatus(200);
});

// Redirect home page
app.get('/', (req, res) => {
    res.redirect(301, config['index-page']);
});

// Create server
app.listen(config.port, () => {
    console.log('Listening on port ' + config.port);
});

module.exports = app;
