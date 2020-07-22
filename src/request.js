/**
 * This file is part of the @iconify/api package.
 *
 * (c) Vjacheslav Trushkin <cyberalien@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

'use strict';

/**
 * Parse request
 *
 * @param {object} app
 * @param {object} req
 * @param {object} res
 * @param {string} query Query
 */
module.exports = (app, req, res, query) => {
	let body;

	switch (query) {
		case 'version':
			body = 'Iconify API version ' + app.version + ' (Node';
			if (app.config.region.length) {
				body += ', ' + app.config.region;
			}
			body += ')';
			app.response(req, res, {
				type: 'text/plain',
				body: body,
			});
			return;

		case 'robots':
			app.response(req, res, {
				type: 'text/plain',
				body: 'User-agent: *\nDisallow: /',
			});
			return;

		case 'reload':
			// Send 200 response regardless of success to prevent visitors from guessing key
			app.response(req, res, 200);

			// Do stuff
			if (
				app.config['reload-secret'].length &&
				req.query &&
				typeof req.query.key === 'string' &&
				req.query.key === app.config['reload-secret'] &&
				!app.reloading
			) {
				process.nextTick(() => {
					app.reload(false)
						.then(() => {})
						.catch(err => {
							app.error(
								'Error reloading collections:\n' +
									util.format(err)
							);
						});
				});
			}
			return;

		case 'sync':
			// Send 200 response regardless of success to prevent visitors from guessing key
			app.response(req, res, 200);

			let repo = req.query.repo;
			if (
				typeof repo !== 'string' ||
				!app.config.canSync ||
				!app.config.sync[repo] ||
				!app.config.sync.git ||
				!app.config.sync.secret
			) {
				return;
			}

			let key = req.query.key;
			if (key !== app.config.sync.secret) {
				return;
			}

			process.nextTick(() => {
				app.sync(repo)
					.then(() => {})
					.catch(err => {
						app.error(err);
					});
			});
			return;
	}
};
