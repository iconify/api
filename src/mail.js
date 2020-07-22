/**
 * This file is part of the @iconify/api package.
 *
 * (c) Vjacheslav Trushkin <cyberalien@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

'use strict';

let nodemailer;

module.exports = (app, message) => {
	if (nodemailer === null) {
		return;
	}

	let config;
	try {
		config = app.config.mail;
		if (!config.active) {
			return;
		}

		if (nodemailer === void 0) {
			nodemailer = require('nodemailer');
		}
	} catch (err) {
		nodemailer = null;
		return;
	}

	let transporter = nodemailer.createTransport(config.transport);

	// Set data
	let mailOptions = {
		from: config.from,
		to: config.to,
		subject: config.subject,
		text: message,
	};

	// Send email
	transporter.sendMail(mailOptions, (err, info) => {
		if (err) {
			console.error('Error sending mail:', err);
		}
	});
};
