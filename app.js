/**
 * This file is part of the @iconify/api package.
 *
 * (c) Vjacheslav Trushkin <cyberalien@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

'use strict';

// Load required modules
const fs = require('fs'),
	util = require('util'),
	express = require('express');

// Log uncaught exceptions to stderr
process.on('uncaughtException', function (err) {
	console.error('Uncaught exception:', err);
});

// Create application
let app = {
	root: __dirname,
};

/**
 * Load config.json and config-default.json
 */
app.config = JSON.parse(
	fs.readFileSync(__dirname + '/config-default.json', 'utf8')
);

try {
	let customConfig = fs.readFileSync(__dirname + '/config.json', 'utf8');
	if (typeof customConfig === 'string') {
		try {
			customConfig = JSON.parse(customConfig);
			Object.keys(customConfig).forEach((key) => {
				if (
					typeof app.config[key] === 'object' &&
					typeof customConfig[key] === 'object'
				) {
					// merge object
					Object.assign(app.config[key], customConfig[key]);
				} else {
					// overwrite scalar variables
					app.config[key] = customConfig[key];
				}
			});
		} catch (err) {
			console.error('Error parsing config.json', err);
		}
	}
} catch (err) {
	console.log('Missing config.json. Using default API configuration');
}

// Add logging and mail modules
app.mail = require('./src/mail').bind(this, app);

let log = require('./src/log');
app.log = log.bind(this, app, false);
app.error = log.bind(this, app, true);

app.logger = require('./src/logger').bind(this, app);

/**
 * Validate configuration
 */
// Port
if (app.config['env-port'] && process.env.PORT) {
	app.config.port = process.env.PORT;
}

// Region file to easy identify server in CDN
if (app.config['env-region']) {
	if (process.env.region) {
		app.config.region = process.env.region;
	} else if (process.env.REGION) {
		app.config.region = process.env.REGION;
	}
}
if (
	app.config.region !== '' &&
	(app.config.region.length > 10 ||
		!app.config.region.match(/^[a-z0-9_-]+$/i))
) {
	app.config.region = '';
	app.error('Invalid value for region config variable.');
}

// Reload secret key
if (app.config['reload-secret'] === '') {
	// Add reload-secret to config.json to be able to run /reload?key=your-secret-key that will reload collections without restarting server
	console.log(
		'reload-secret configuration is empty. You will not be able to update all collections without restarting server.'
	);
}

/**
 * Continue loading modules
 */

// Get version
app.version = JSON.parse(
	fs.readFileSync(__dirname + '/package.json', 'utf8')
).version;

// Files helper
app.fs = require('./src/files')(app);

// JSON loader
app.loadJSON = require('./src/json').bind(this, app);

// Add directories storage
app.dirs = require('./src/dirs')(app);
if (!app.dirs.getRepos().length) {
	console.error(
		'No repositories found. Make sure either Iconify or custom repository is set in configuration.'
	);
	return;
}

// Collections
app.collections = Object.create(null);
app.reload = require('./src/reload').bind(this, app);

// Sync module
app.sync = require('./src/sync').bind(this, app);

// API request and response handlers
app.response = require('./src/response').bind(this, app);
app.iconsRequest = require('./src/request-icons').bind(this, app);
app.miscRequest = require('./src/request').bind(this, app);

// Start application
require('./src/startup')(app)
	.then(() => {
		// Create HTTP server
		app.server = express();

		// Disable X-Powered-By header
		app.server.disable('x-powered-by');

		// CORS
		app.server.options('/*', (req, res) => {
			if (app.config.cors) {
				res.header(
					'Access-Control-Allow-Origin',
					app.config.cors.origins
				);
				res.header(
					'Access-Control-Allow-Methods',
					app.config.cors.methods
				);
				res.header(
					'Access-Control-Allow-Headers',
					app.config.cors.headers
				);
				res.header('Access-Control-Max-Age', app.config.cors.timeout);
			}
			res.send(200);
		});

		// GET 3 part request
		app.server.get(
			/^\/([a-z0-9-]+)\/([a-z0-9-]+)\.(js|json|svg)$/,
			(req, res) => {
				// prefix/icon.svg
				// prefix/icons.json
				app.iconsRequest(
					req,
					res,
					req.params[0],
					req.params[1],
					req.params[2]
				);
			}
		);

		// GET 2 part JS/JSON request
		app.server.get(/^\/([a-z0-9-]+)\.(js|json)$/, (req, res) => {
			// prefix.json
			app.iconsRequest(req, res, req.params[0], 'icons', req.params[1]);
		});

		// GET 2 part SVG request
		app.server.get(/^\/([a-z0-9:-]+)\.svg$/, (req, res) => {
			let parts = req.params[0].split(':');

			if (parts.length === 2) {
				// prefix:icon.svg
				app.iconsRequest(req, res, parts[0], parts[1], 'svg');
				return;
			}

			if (parts.length === 1) {
				parts = parts[0].split('-');
				if (parts.length > 1) {
					// prefix-icon.svg
					app.iconsRequest(
						req,
						res,
						parts.shift(),
						parts.join('-'),
						'svg'
					);
					return;
				}
			}

			app.response(req, res, 404);
		});

		// Send robots.txt that disallows everything
		app.server.get('/robots.txt', (req, res) =>
			app.miscRequest(req, res, 'robots')
		);
		app.server.post('/robots.txt', (req, res) =>
			app.miscRequest(req, res, 'robots')
		);

		// API version information
		app.server.get('/version', (req, res) =>
			app.miscRequest(req, res, 'version')
		);

		// Reload collections without restarting app
		app.server.get('/reload', (req, res) =>
			app.miscRequest(req, res, 'reload')
		);
		app.server.post('/reload', (req, res) =>
			app.miscRequest(req, res, 'reload')
		);

		// Get latest collection from Git repository
		app.server.get('/sync', (req, res) =>
			app.miscRequest(req, res, 'sync')
		);
		app.server.post('/sync', (req, res) =>
			app.miscRequest(req, res, 'sync')
		);

		// Redirect home page
		app.server.get('/', (req, res) => {
			res.redirect(301, app.config['index-page']);
		});

		// Create server
		app.server.listen(app.config.port, () => {
			app.log('Listening on port ' + app.config.port);
		});
	})
	.catch((err) => {
		console.error(err);
	});
