"use strict";

(() => {
    const calculateDimension = require('../src/svg-dimensions');

    const chai = require('chai'),
        expect = chai.expect,
        should = chai.should();

    describe('Testing dimensions function', () => {
        it('numbers', () => {
            let width = 48,
                height = 36,
                result;

            // Get height knowing width
            result = calculateDimension(width, height / width);
            expect(result).to.be.equal(height);

            // Get width knowing height
            result = calculateDimension(height, width / height);
            expect(result).to.be.equal(width);

            // Get height for custom width
            result = calculateDimension(24, height / width);
            expect(result).to.be.equal(18);

            result = calculateDimension(30, height / width);
            expect(result).to.be.equal(22.5);

            result = calculateDimension(99, height / width);
            expect(result).to.be.equal(74.25);

            // Get width for custom height
            result = calculateDimension(18, width / height);
            expect(result).to.be.equal(24);

            result = calculateDimension(74.25, width / height);
            expect(result).to.be.equal(99);

            // Test floating numbers
            result = calculateDimension(16, 10 / 9);
            expect(result).to.be.equal(17.78);

            result = calculateDimension(16, 10 / 9, 1000);
            expect(result).to.be.equal(17.778);
        });

        it('strings', () => {
            let width = 48,
                height = 36,
                result;

            // Strings without units
            result = calculateDimension('48', height / width);
            expect(result).to.be.equal('36');

            // Pixels
            result = calculateDimension('48px', height / width);
            expect(result).to.be.equal('36px');

            // Percentages
            result = calculateDimension('36%', width / height);
            expect(result).to.be.equal('48%');

            // em
            result = calculateDimension('1em', height / width);
            expect(result).to.be.equal('0.75em');

            result = calculateDimension('1em', width / height);
            expect(result).to.be.equal('1.34em');

            result = calculateDimension('1em', width / height, 1000);
            expect(result).to.be.equal('1.334em');

            // custom units with space
            result = calculateDimension('48 Whatever', height / width);
            expect(result).to.be.equal('36 Whatever');

            // numbers after unit should be parsed too
            result = calculateDimension('48% + 5em', height / width);
            expect(result).to.be.equal('36% + 3.75em');

            // calc()
            result = calculateDimension('calc(100% - 48px)', height / width);
            expect(result).to.be.equal('calc(75% - 36px)');

            // -webkit-calc()
            result = calculateDimension('-webkit-calc(100% - 48px)', height / width);
            expect(result).to.be.equal('-webkit-calc(75% - 36px)');
        });

        it('strings without units', () => {
            let width = 48,
                height = 36,
                result;

            // invalid number
            result = calculateDimension('-.', height / width);
            expect(result).to.be.equal('-.');

            // variable
            result = calculateDimension('@width', height / width);
            expect(result).to.be.equal('@width');
        });
    });
})();
