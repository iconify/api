'use strict';

(() => {
	const loadJSON = require('../src/json');

	const fs = require('fs'),
		chai = require('chai'),
		expect = chai.expect,
		should = chai.should();

	describe('Loading JSON file', () => {
		const filename = __dirname + '/fixtures/test1.json',
			expectedResult = JSON.parse(fs.readFileSync(filename, 'utf8'));

		// Check if stream method is available
		let testStream;
		try {
			require('JSONStream');
			require('event-stream');
			testStream = true;
		} catch (err) {
			testStream = false;
		}

		// Test with each method
		['json', 'eval', 'stream'].forEach(method => {
			it(method, function(done) {
				if (method === 'stream' && !testStream) {
					this.skip();
					return;
				}

				// Load file
				loadJSON(method, filename)
					.then(result => {
						expect(result.changed).to.be.equal(true);
						expect(result.data).to.be.eql(expectedResult);

						// Load file with same hash
						loadJSON(method, filename, result.hash)
							.then(result2 => {
								expect(result2.changed).to.be.equal(false);
								expect(result2.hash).to.be.equal(result.hash);

								done();
							})
							.catch(err => {
								done(err);
							});
					})
					.catch(err => {
						done(err);
					});
			});
		});
	});
})();
