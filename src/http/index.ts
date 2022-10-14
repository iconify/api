import fastify, { FastifyReply } from 'fastify';
import { appConfig } from '../config/app';
import { runWhenLoaded } from '../data/loading';
import { iconNameRoutePartialRegEx, iconNameRouteRegEx, splitIconName } from '../misc/name';
import { generateIconsDataResponse } from './responses/icons';
import { generateSVGResponse } from './responses/svg';
import { initVersionResponse, versionResponse } from './responses/version';

/**
 * Start HTTP server
 */
export async function startHTTPServer() {
	// Create HTP server
	const server = fastify({
		caseSensitive: true,
	});

	// Generate headers to send
	interface Header {
		key: string;
		value: string;
	}
	const headers: Header[] = [];
	appConfig.headers.forEach((item) => {
		const parts = item.split(':');
		if (parts.length > 1) {
			headers.push({
				key: parts.shift() as string,
				value: parts.join(':').trim(),
			});
		}
	});
	server.addHook('preHandler', (req, res, done) => {
		for (let i = 0; i < headers.length; i++) {
			const header = headers[i];
			res.header(header.key, header.value);
		}
		done();
	});

	// Init various responses
	await initVersionResponse();

	// Types for common params
	interface PrefixParams {
		prefix: string;
	}
	interface NameParams {
		name: string;
	}

	// SVG: /prefix/icon.svg, /prefix:name.svg, /prefix-name.svg
	server.get(
		'/:prefix(' + iconNameRoutePartialRegEx + ')/:name(' + iconNameRoutePartialRegEx + ').svg',
		(req, res) => {
			type Params = PrefixParams & NameParams;
			const name = req.params as Params;
			runWhenLoaded(() => {
				generateSVGResponse(name.prefix, name.name, req.query, res);
			});
		}
	);

	// SVG: /prefix:name.svg, /prefix-name.svg
	server.get('/:name(' + iconNameRouteRegEx + ').svg', (req, res) => {
		const name = splitIconName((req.params as NameParams).name);
		if (name) {
			runWhenLoaded(() => {
				generateSVGResponse(name.prefix, name.name, req.query, res);
			});
		} else {
			res.send(404);
		}
	});

	// Icons data: /prefix/icons.json, /prefix.json
	server.get('/:prefix(' + iconNameRoutePartialRegEx + ')/icons.json', (req, res) => {
		runWhenLoaded(() => {
			generateIconsDataResponse((req.params as PrefixParams).prefix, false, req.query, res);
		});
	});
	server.get('/:prefix(' + iconNameRoutePartialRegEx + ').json', (req, res) => {
		runWhenLoaded(() => {
			generateIconsDataResponse((req.params as PrefixParams).prefix, false, req.query, res);
		});
	});

	// Icons data: /prefix/icons.js, /prefix.js
	server.get('/:prefix(' + iconNameRoutePartialRegEx + ')/icons.js', (req, res) => {
		runWhenLoaded(() => {
			generateIconsDataResponse((req.params as PrefixParams).prefix, true, req.query, res);
		});
	});
	server.get('/:prefix(' + iconNameRoutePartialRegEx + ').js', (req, res) => {
		runWhenLoaded(() => {
			generateIconsDataResponse((req.params as PrefixParams).prefix, true, req.query, res);
		});
	});

	// Options
	server.options('/*', (req, res) => {
		res.send(200);
	});

	// Robots
	server.get('/robots.txt', (req, res) => {
		res.send('User-agent: *\nDisallow: /\n');
	});

	// Version
	server.get('/version', (req, res) => {
		res.send(versionResponse(req.query));
	});
	server.post('/version', (req, res) => {
		res.send(versionResponse(req.query));
	});

	// Redirect
	server.get('/', (req, res) => {
		res.redirect(301, appConfig.redirectIndex);
	});

	// Error handling
	server.setDefaultRoute((req, res) => {
		res.statusCode = 301;
		res.setHeader('Location', appConfig.redirectIndex);

		// Need to set custom headers because hooks don't work here
		for (let i = 0; i < headers.length; i++) {
			const header = headers[i];
			res.setHeader(header.key, header.value);
		}

		res.end();
	});

	// Start it
	console.log('Listening on', appConfig.host + ':' + appConfig.port);
	server.listen({
		host: appConfig.host,
		port: appConfig.port,
	});
}
