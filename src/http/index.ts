import fastify from 'fastify';
import fastifyFormBody from '@fastify/formbody';
import { appConfig, httpHeaders } from '../config/app';
import { runWhenLoaded } from '../data/loading';
import { iconNameRoutePartialRegEx, iconNameRouteRegEx, splitIconName } from '../misc/name';
import { generateAPIv1IconsListResponse } from './responses/collection-v1';
import { generateAPIv2CollectionResponse } from './responses/collection-v2';
import { generateCollectionsListResponse } from './responses/collections';
import { generateIconsDataResponse } from './responses/icons';
import { generateKeywordsResponse } from './responses/keywords';
import { generateLastModifiedResponse } from './responses/modified';
import { generateAPIv2SearchResponse } from './responses/search';
import { generateSVGResponse } from './responses/svg';
import { generateUpdateResponse } from './responses/update';
import { initVersionResponse, versionResponse } from './responses/version';
import { generateIconsStyleResponse } from './responses/css';

/**
 * Start HTTP server
 */
export async function startHTTPServer() {
	// Create HTP server
	const server = fastify({
		caseSensitive: true,
	});

	// Support `application/x-www-form-urlencoded`
	server.register(fastifyFormBody);

	// Generate headers to send
	interface Header {
		key: string;
		value: string;
	}
	const headers: Header[] = [];
	httpHeaders.forEach((item) => {
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

	// Stylesheet: /prefix.css
	server.get('/:prefix(' + iconNameRoutePartialRegEx + ').css', (req, res) => {
		runWhenLoaded(() => {
			generateIconsStyleResponse((req.params as PrefixParams).prefix, req.query, res);
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

	// Last modification time
	server.get('/last-modified', (req, res) => {
		runWhenLoaded(() => {
			generateLastModifiedResponse(req.query, res);
		});
	});

	if (appConfig.enableIconLists) {
		// Icon sets list
		server.get('/collections', (req, res) => {
			runWhenLoaded(() => {
				generateCollectionsListResponse(req.query, res);
			});
		});

		// Icons list, API v2
		server.get('/collection', (req, res) => {
			runWhenLoaded(() => {
				generateAPIv2CollectionResponse(req.query, res);
			});
		});

		// Icons list, API v1
		server.get('/list-icons', (req, res) => {
			runWhenLoaded(() => {
				generateAPIv1IconsListResponse(req.query, res, false);
			});
		});
		server.get('/list-icons-categorized', (req, res) => {
			runWhenLoaded(() => {
				generateAPIv1IconsListResponse(req.query, res, true);
			});
		});

		if (appConfig.enableSearchEngine) {
			// Search, currently version 2
			server.get('/search', (req, res) => {
				runWhenLoaded(() => {
					generateAPIv2SearchResponse(req.query, res);
				});
			});

			// Keywords
			server.get('/keywords', (req, res) => {
				runWhenLoaded(() => {
					generateKeywordsResponse(req.query, res);
				});
			});
		}
	}

	// Update icon sets
	server.get('/update', (req, res) => {
		generateUpdateResponse(req.query, res);
	});
	server.post('/update', (req, res) => {
		generateUpdateResponse(req.query, res);
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
	if (appConfig.enableVersion) {
		server.get('/version', (req, res) => {
			versionResponse(req.query, res);
		});
		server.post('/version', (req, res) => {
			versionResponse(req.query, res);
		});
	}

	// Redirect
	server.get('/', (req, res) => {
		res.redirect(301, appConfig.redirectIndex);
	});

	// Error handling
	server.setDefaultRoute((req, res) => {
		res.statusCode = 404;
		console.log('404:', req.url);

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
