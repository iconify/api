'use strict';

(() => {
	const chai = require('chai'),
		expect = chai.expect,
		should = chai.should();

	describe('Splitting query string', () => {
		it('3 part requests', () => {
			const exp = /^\/([a-z0-9-]+)\/([a-z0-9-]+)\.(js|json|svg)$/;

			function test(str) {
				let result = str.match(exp);
				if (!result) {
					return null;
				}

				// Remove first parameter and named parameters that don't exist in Expression.js params
				result.shift();
				delete result.index;
				delete result.input;

				return result;
			}

			// SVG
			expect(test('/foo/bar.svg')).to.be.eql(['foo', 'bar', 'svg']);
			expect(test('/fa-pro/test-icon.svg')).to.be.eql([
				'fa-pro',
				'test-icon',
				'svg',
			]);

			// icons
			expect(test('/foo/icons.js')).to.be.eql(['foo', 'icons', 'js']);
			expect(test('/long-prefixed-v1/icons.json')).to.be.eql([
				'long-prefixed-v1',
				'icons',
				'json',
			]);

			// Too long
			expect(test('/fa-pro/test/icon.svg')).to.be.equal(null);

			// Upper case
			expect(test('/SomePrefix/Test.SVG')).to.be.equal(null);

			// Invalid characters
			expect(test('/foo_bar/test.svg')).to.be.equal(null);
		});

		it('2 part js/json requests', () => {
			const exp = /^\/([a-z0-9-]+)\.(js|json)$/;

			function test(str) {
				let result = str.match(exp);
				if (!result) {
					return null;
				}

				// Remove first parameter and named parameters that don't exist in Expression.js params
				result.shift();
				delete result.index;
				delete result.input;

				return result;
			}

			// icons
			expect(test('/foo.js')).to.be.eql(['foo', 'js']);
			expect(test('/long-prefixed-v1.json')).to.be.eql([
				'long-prefixed-v1',
				'json',
			]);

			// Too long
			expect(test('/fa-pro/icons.js')).to.be.equal(null);

			// Upper case
			expect(test('/SomePrefix.JSON')).to.be.equal(null);

			// Invalid characters
			expect(test('/foo_bar.json')).to.be.equal(null);
		});

		it('2 part svg requests', () => {
			const exp = /^\/([a-z0-9:\-]+)\.svg$/;

			function test(str) {
				let result = str.match(exp);
				if (!result) {
					return null;
				}

				// Remove first parameter and named parameters that don't exist in Expression.js params
				result.shift();
				delete result.index;
				delete result.input;

				return result;
			}

			// icons
			expect(test('/foo.svg')).to.be.eql(['foo']);
			expect(test('/long-prefixed-v1.svg')).to.be.eql([
				'long-prefixed-v1',
			]);
			expect(test('/long-prefixed:icon-v1.svg')).to.be.eql([
				'long-prefixed:icon-v1',
			]);

			// Too long
			expect(test('/fa-pro/icons.svg')).to.be.equal(null);

			// Upper case
			expect(test('/SomePrefix.SVG')).to.be.equal(null);

			// Invalid characters
			expect(test('/foo_bar.svg')).to.be.equal(null);
		});
	});
})();
