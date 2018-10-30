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
         * Send message
         *
         * @param message
         */
        let sendMail = message => {
            // Create transport
            let transporter = nodemailer.createTransport(config.mail.transport);

            // Set data
            let mailOptions = {
                from: config.mail.from,
                to: config.mail.to,
                subject: config.mail.subject,
                text: message
            };

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

        /**
         * Send messages queue
         */
        let sendQueue = () => {
            let mailOptions = throttledData.join('\n\n- - - - - - - - - - -\n\n');

            throttled = false;
            throttledData = [];

            sendMail(mailOptions);
        };

        console.log('Logging to email is active. If you do not receive emails with errors, check configuration options.');

        /**
         *
         * @param {string} message
         * @param {string} [key] Unique key to identify logging message to avoid sending too many duplicate emails
         * @param {boolean} [copyToConsole] True if log should be copied to console
         * @param {object} [logger] Logger instance to copy message to
         */
        config.log = (message, key, copyToConsole, logger) => {
            if (copyToConsole) {
                console.error('\x1b[31m' + message + '\x1b[0m');
            }
            if (logger) {
                logger.log(message);
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
                    setTimeout(sendQueue, config.mail.throttle * 1000);
                }
            } else {
                sendQueue();
            }
        };

        /**
         * Class for logging
         *
         * @type {Logger}
         */
        config.Logger = class {
            /**
             * Create new logger
             *
             * @param {string} subject
             * @param {number} [delay] Automatically send log after "delay" seconds
             */
            constructor(subject, delay) {
                this.active = true;
                this.subject = subject;
                this.messages = [subject];
                if (delay) {
                    setTimeout(() => {
                        if (this.messages.length) {
                            this.send();
                        }
                    }, delay * 1000);
                }
            }

            /**
             * Log message
             *
             * @param {string} message
             * @param {boolean} [sendToConsole]
             */
            log(message, sendToConsole) {
                if (sendToConsole === true) {
                    console.log(message);
                }
                this.messages.push(message);
            }

            /**
             * Send logged messages
             */
            send() {
                if (!this.messages.length) {
                    return;
                }

                sendMail(this.messages.join("\n"));
                this.messages = [];
            }
        };
    } else {
        console.log('Logging to email is not active.');
        config.log = (message, key, copyToConsole, logger) => {
            if (copyToConsole) {
                console.error('\x1b[35m' + message + '\x1b[0m');
            }
        };
        config.Logger = class {
            constructor(subject) {
                this.active = false;
            }
            log(message, sendToConsole) {
                if (sendToConsole === true) {
                    console.log(message);
                }
            }
            send() {}
        };
    }
};
