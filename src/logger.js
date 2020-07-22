/**
 * This file is part of the @iconify/api package.
 *
 * (c) Vjacheslav Trushkin <cyberalien@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

'use strict';

class Logger {
	constructor(app, subject, delay) {
		this.app = app;
		this.subject = subject;
		this.messages = [];
		this.delay =
			typeof delay === 'number' ? Math.min(Math.max(delay, 15), 300) : 60;
		this.throttled = false;
	}

	send() {
		if (this.messages.length) {
			this.app.mail(
				(this.subject ? this.subject + '\n\n' : '') +
					this.messages.join('\n')
			);
			this.messages = [];
		}
	}

	queue() {
		if (!this.throttled) {
			this.throttled = true;
			setTimeout(() => {
				this.send();
				this.throttled = false;
			}, this.delay * 1000);
		}
	}

	log(message) {
		this.messages.push(message);
		if (!this.throttled) {
			this.queue();
		}
	}

	error(message) {
		this.messages.push(message);
		if (!this.throttled) {
			this.queue();
		}
	}
}

/**
 * Bulk message logger. It combines several messages and puts them in one email.
 *
 * Usage: logger = app.logger('subject', 60)
 * then use it as "logger" parameter in app.log or app.error calls
 *
 * @param {object} app API application
 * @param {string|null} [subject] Log subject
 * @param {number} [delay] Delay of first set of messages
 * @return {object}
 */
module.exports = (app, subject, delay) => new Logger(app, subject, delay);
