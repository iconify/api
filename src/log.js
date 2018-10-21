/**
 * This file is part of the @iconify/api package.
 *
 * (c) Vjacheslav Trushkin <cyberalien@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

"use strict";

const nodemailer = require('nodemailer');

/**
 * Inject logging function as config.log()
 *
 * @param config
 */
module.exports = config => {
    if (config.mail && config.mail.active) {
        let logged = {},
            mailError = false,
            throttled = false,
            throttledData = [],
            repeat = Math.max(config.mail.repeat, 15) * 60 * 1000; // convert minutes to ms, no less than 15 minutes

        /**
         * Send messages queue
         */
        let send = () => {
            throttled = false;

            // Create transport
            let transporter = nodemailer.createTransport(config.mail.transport);

            // Mail options
            let mailOptions = {
                from: config.mail.from,
                to: config.mail.to,
                subject: config.mail.subject,
                text: throttledData.join('\n\n- - - - - - - - - - -\n\n')
            };
            throttledData = [];

            // Send email
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    if (mailError === false) {
                        console.error('Error sending mail (this messages will not show up again on further email errors until app is restarted):');
                        console.error(err);
                        mailError = true;
                    }
                }
            });
        };

        console.log('Logging to email is active. If you do not receive emails with errors, check configuration options.');

        /**
         *
         * @param {string} message
         * @param {string} [key] Unique key to identify logging message to avoid sending too many duplicate emails
         * @param {boolean} [copyToConsole] True if log should be copied to console
         */
        config.log = (message, key, copyToConsole) => {
            if (copyToConsole) {
                console.error('\x1b[31m' + message + '\x1b[0m');
            }

            // Do not send same email more than once within "repeat" minutes
            let time = Date.now() / repeat;
            if (typeof key === 'string') {
                if (logged[key] === time) {
                    return;
                }
                logged[key] = time;
            }

            // Throttle
            throttledData.push(message);
            if (config.mail.throttle) {
                if (!throttled) {
                    throttled = true;
                    setTimeout(send, config.mail.throttle * 1000);
                }
            } else {
                send();
            }
        };
    } else {
        console.log('Logging to email is not active.');
        config.log = (message, key, copyToConsole) => {
            if (copyToConsole) {
                console.error('\x1b[35m' + message + '\x1b[0m');
            }
        };
    }
};
