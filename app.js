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

// Directory with json files for custom icon sets
// Use simple-svg-tools package to create json collections
const customIconsDirectory = 'json';

// HTTP port
// Run ssl.js for SSL support
const port = process.env.PORT || 3000;


/*
 *  Main stuff
 */
const fs = require('fs'),
    // Express stuff
    express = require('express'),
    compression = require('compression'),
    app = express(),

    // Debug stuff
    version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version,

    // CDN stuff
    cdn = require('simple-svg-cdn');

// Cache time
const cache = 3600; // cache time in seconds
const cacheMin = cache; // minimum cache refresh time in seconds

// Load default collections
if (serveDefaultIcons) {
    const icons = require('simple-svg-icons');
    Object.keys(icons.collections()).forEach(prefix => {
        let filename = icons.locate(prefix),
            data;
        try {
            data = fs.readFileSync(filename, 'utf8');
            data = JSON.parse(data);
            cdn.deOptimize(data);
        } catch (err) {
            console.log(err);
            return;
        }
        console.log('Added premade collection: ' + prefix);
        cdn.addCollection(prefix, data);
    });
}

// Add collections from "json" directory
let files;
try {
    files = fs.readdirSync(customIconsDirectory);
} catch (err) {
    files = [];
}
files.forEach(file => {
    let list = file.split('.');
    if (list.length !== 2 || list[1] !== 'json') {
        return;
    }
    try {
        let data = fs.readFileSync(customIconsDirectory + '/' + file, 'utf8');
        data = JSON.parse(data);
        cdn.deOptimize(data);
        console.log('Added custom collection: ' + list[0]);
        cdn.addCollection(list[0], data);
    } catch (err) {

    }
});

// Sort collections
cdn.sortPrefixes();

// Disable X-Powered-By header and enable compression
app.disable('x-powered-by');
app.use(compression({
    filter: (req, res) => true
}));

// CORS
app.options('/*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Accept-Encoding');
    res.header('Access-Control-Max-Age', 86400);
    res.send(200);
});

// GET request
app.get(/\/([a-z0-9\-]+)\/([a-z0-9\-,]+\.(js|json|svg))?$/, (req, res) => {
    let collection = cdn.findCollection(req.params[0]),
        result;

    if (collection === null) {
        result = 404;
    } else {
        result = cdn.parser(collection, req.params[1], req.query);
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
        res.set('Cache-Control', 'public, max-age=' + cache + ', min-refresh=' + cacheMin);
    }

    // Send data
    res.type(result.type).send(result.body);
});

// Debug information and AWS health check
app.get('/version', (req, res) => {
    let body = 'SimpleSVG CDN version ' + version + ' (Node';
    if (process.env.region) {
        body += ', ' + process.env.region;
    }
    body += ')';
    res.send(body);
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