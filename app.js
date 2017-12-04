/**
 * Main file to run in Node.js
 *
 * Run ssl.js instead of you want SSL support.
 */
"use strict";

/*
 * Configuration
 */
// True if server should include default icons set
const serveDefaultIcons = true;

// Directories with json files for custom icon sets
// Use simple-svg-tools package to create json collections
const customIconDirectories = ['json'];

// HTTP port
// Run ssl.js for SSL support
const port = process.env.PORT || 3000;

// Cache configuration
const cache = 604800, // cache time in seconds
    cacheMin = cache, // minimum cache refresh time in seconds
    cachePrivate = false; // True if cache is private. Used in Cache-Control header in response

/*
 *  Main stuff
 */
const fs = require('fs'),
    // Express stuff
    express = require('express'),
    app = express(),

    // Debug stuff
    version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version,

    // Included files
    Collections = require('./src/collections'),

    // Query parser
    parseQuery = require('./src/query');

// Region file to easy identify server in CDN
let region = '';
if (!region.length && process.env.region) {
    region = process.env.region;
}
try {
    region = fs.readFileSync('region.txt', 'utf8').trim();
} catch (err) {
}
if (region.length > 10 || !region.match(/^[a-z0-9_-]+$/i)) {
    region = '';
}

// Reload key
let reloadKey = '';
try {
    reloadKey = fs.readFileSync('.reload', 'utf8').trim();
} catch (err) {
}
if (reloadKey.length < 8 || reloadKey.length > 64) {
    reloadKey = '';
}

// Icons module
const icons = serveDefaultIcons ? require('simple-svg-icons') : null;

// Collections list
let collections = null,
    loading = true;

/**
 * Load icons
 *
 * @returns {Promise}
 */
function loadIcons() {
    return new Promise((fulfill, reject) => {
        let t = Date.now(),
            newCollections = new Collections(console.log);

        console.log('Loading collections at ' + (new Date()).toString());

        // Load default collections
        if (icons !== null) {
            Object.keys(icons.collections()).forEach(prefix => {
                newCollections.addFile(icons.locate(prefix));
            });
        }

        // Add collections from "json" directory
        customIconDirectories.forEach(dir => {
            newCollections.addDirectory(dir);
        });

        newCollections.load().then(() => {
            console.log('Loaded in ' + (Date.now() - t) + 'ms');
            fulfill(newCollections);
        }).catch(err => {
            reject(err);
        });
    });
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

        if (typeof result === 'number') {
            res.sendStatus(result);
            return;
        }

        // Send cache header
        if (
            cache &&
            (req.get('Pragma') === void 0 || req.get('Pragma').indexOf('no-cache') === -1) &&
            (req.get('Cache-Control') === void 0 || req.get('Cache-Control').indexOf('no-cache') === -1)
        ) {
            res.set('Cache-Control', (cachePrivate ? 'private' : 'public') + ', max-age=' + cache + ', min-refresh=' + cacheMin);
            if (!cachePrivate) {
                res.set('Pragma', 'cache');
            }
        }

        // Check for download
        if (result.filename !== void 0 && (req.query.download === '1' || req.query.download === 'true')) {
            res.set('Content-Disposition', 'attachment; filename="' + result.filename + '"');
        }

        // Send data
        res.type(result.type).send(result.body);
    }

    // Parse query
    if (collections === null) {
        // This means script is still loading
        // Attempt to parse query every 100ms for up to 2 seconds
        let attempts = 0,
            timer = setInterval(function() {
                attempts ++;
                if (collections === null) {
                    if (attempts > 20) {
                        clearInterval(timer);
                        res.sendStatus(503);
                    }
                } else {
                    clearInterval(timer);
                    parse();
                }
            }, 100);

    } else {
        parse();
    }
}

// Load icons
loadIcons().then(newCollections => {
    collections = newCollections;
    loading = false;
}).catch(err => {
    console.log('Fatal error loading collections:', err);
    loading = false;
});

// Disable X-Powered-By header
app.disable('x-powered-by');

// CORS
app.options('/*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Accept-Encoding');
    res.header('Access-Control-Max-Age', 86400);
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

// Debug information and AWS health check
app.get('/version', (req, res) => {
    let body = 'SimpleSVG CDN version ' + version + ' (Node';
    if (region.length) {
        body += ', ' + region;
    }
    body += ')';
    res.send(body);
});

// Reload collections without restarting app
app.get('/reload', (req, res) => {
    if (reloadKey.length && req.query && req.query.key && req.query.key === reloadKey) {
        // Reload collections
        process.nextTick(() => {
            if (loading) {
                return;
            }
            loading = true;
            loadIcons().then(newCollections => {
                collections = newCollections;
                loading = false;
            }).catch(err => {
                console.log('Fatal error loading collections:', err);
                loading = false;
            });
        });
    }

    res.sendStatus(200);
});

// Redirect home page
app.get('/', (req, res) => {
    res.redirect(301, 'https://simplesvg.com/');
});

// Create server
app.listen(port, () => {
    console.log('Listening on port ' + port);
});

module.exports = app;
