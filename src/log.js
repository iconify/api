/**
 * This file is part of the @iconify/api package.
 *
 * (c) Vjacheslav Trushkin <cyberalien@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

'use strict';

const util = require('util');

const defaultOptions = {
	// True if message should be copied to stdout or stderr
	log: true,

	// Logger object for event logging (combines multiple messages for one big log)
	logger: null,

	// Unique key. If set, message with that key will be sent by mail only once. Used to avoid sending too many emails
	key: null,

	// Console object
	console: console,
};

// List of notices that are sent only once per session
let logged = Object.create(null);

// List of throttled messages
let throttled = null;

/**
 * Send throttled messages
 *
 * @param app
 */
const sendQueue = (app) => {
	let text = throttled.join('\n\n- - - - - - - - - - -\n\n');
	throttled = null;
	app.mail(text);
};

const months = {
	0: 'Jan',
	1: 'Feb',
	2: 'Mar',
	3: 'Apr',
	4: 'May',
	5: 'June',
	6: 'July',
	7: 'Aug',
	8: 'Sep',
	9: 'Oct',
	10: 'Nov',
	11: 'Dec',
};

const logTime = () => {
	let time = new Date();

	let result = '[';
	// Add date
	result +=
		time.getUTCDate() +
		' ' +
		months[time.getUTCMonth()] +
		' ' +
		time.getUTCFullYear();
	// Add time
	result +=
		(time.getUTCHours() > 9 ? ' ' : ' 0') +
		time.getUTCHours() +
		(time.getUTCMinutes() > 9 ? ':' : ':0') +
		time.getUTCMinutes() +
		(time.getUTCSeconds() > 9 ? ':' : ':0') +
		time.getUTCSeconds();
	result += '] ';
	return result;
};

/**
 * Log message. This function combines multiple logging methods, so it can be called only once instead of calling
 * multiple log() functions.
 *
 * Message will be sent to console.log or console.error and sent by email.
 *
 * @param {object} app
 * @param {boolean} error
 * @param {string} message
 * @param {object|boolean} [options]
 */
module.exports = (app, error, message, options) => {
	options = Object.assign(
		Object.create(null),
		defaultOptions,
		options === void 0
			? Object.create(null)
			: typeof options === 'boolean'
			? {
					log: options,
			  }
			: options
	);

	// Convert to test
	if (typeof message !== 'string') {
		message = util.format(message);
	}

	// Get time stamp
	let time = logTime();

	// Copy message to console
	if (options.log || !app.mail) {
		if (error) {
			options.console.error(time + '\x1b[31m' + message + '\x1b[0m');
		} else {
			options.console.log(time + message);
		}
	}

	if (!app.mail) {
		return;
	}
	message = time + message;

	// Copy to mail logger
	if (options.logger) {
		options.logger[error ? 'error' : 'log'](message);
		return;
	}

	// Send email if its a error and has not been sent before
	if (!error) {
		return;
	}
	if (options.key) {
		let time = Date.now() / 1000,
			repeat;

		try {
			repeat = app.config.mail.repeat;
		} catch (err) {
			repeat = 0;
		}

		if (logged[options.key]) {
			if (!repeat || logged[options.key] > time) {
				return;
			}
		}
		logged[options.key] = repeat ? time + repeat : true;
	}

	// Add message to throttled data
	if (throttled === null) {
		throttled = [];
		let delay;
		try {
			delay = app.config.mail.throttle;
		} catch (err) {
			delay = 60;
		}
		setTimeout(sendQueue.bind(null, app), delay * 1000);
	}
	throttled.push(message);
};
