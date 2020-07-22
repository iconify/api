'use strict';

(() => {
	const log = require('../src/log');

	const chai = require('chai'),
		expect = chai.expect,
		should = chai.should();

	describe('Logging messages', () => {
		it('logging error to console and mail', done => {
			let logged = {
				log: false,
				mail: false,
			};
			let fakeApp = {
				mail: message => {
					expect(
						message.indexOf(expectedMessage) !== false
					).to.be.equal(true);
					logged.mail = true;
				},
				logger: () => {
					done('logger() should not have been called');
				},
				config: {
					mail: {
						throttle: 0.2,
					},
				},
			};

			let expectedMessage = 'This is a test';
			log(fakeApp, true, expectedMessage, {
				console: {
					error: message => {
						expect(
							message.indexOf(expectedMessage) !== false
						).to.be.equal(true);
						logged.log = true;
					},
					log: message => {
						done('console.log should not have been called');
					},
				},
			});

			setTimeout(() => {
				expect(logged).to.be.eql({
					log: true,
					mail: true,
				});
				done();
			}, 500);
		});

		it('logging message to console', done => {
			let logged = {
				log: false,
			};
			let fakeApp = {
				mail: message => {
					done('mail() should not have been called');
				},
				logger: () => {
					done('logger() should not have been called');
				},
				config: {
					mail: {
						throttle: 0.2,
					},
				},
			};

			let expectedMessage = 'This is a test';
			log(fakeApp, false, expectedMessage, {
				console: {
					log: message => {
						expect(
							message.indexOf(expectedMessage) !== false
						).to.be.equal(true);
						logged.log = true;
					},
					error: message => {
						done('console.log should not have been called');
					},
				},
			});

			setTimeout(() => {
				expect(logged).to.be.eql({
					log: true,
				});
				done();
			}, 500);
		});

		it('logging same error only once', done => {
			let logged = {
				log: false,
				mail: false,
			};
			let fakeApp = {
				mail: message => {
					if (logged.mail) {
						done('mail() was called twice');
					}
					expect(
						message.indexOf(expectedMessage) !== false
					).to.be.equal(true);
					logged.mail = true;
				},
				logger: () => {
					done('logger() should not have been called');
				},
				config: {
					mail: {
						throttle: 0.2,
					},
				},
			};

			let expectedMessage = 'This is a test',
				fakeConsole = {
					error: message => {
						expect(
							message.indexOf(expectedMessage) !== false
						).to.be.equal(true);
						logged.log = true;
					},
					log: message => {
						done('console.log should not have been called');
					},
				};

			log(fakeApp, true, expectedMessage, {
				console: fakeConsole,
				key: 'test',
			});
			log(fakeApp, true, expectedMessage, {
				console: fakeConsole,
				key: 'test',
			});

			setTimeout(() => {
				expect(logged).to.be.eql({
					log: true,
					mail: true,
				});
				done();
			}, 500);
		});
	});
})();
