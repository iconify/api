"use strict";

(() => {
    const generateSVG = require('../src/svg');

    const chai = require('chai'),
        expect = chai.expect,
        should = chai.should();

    describe('Testing SVG generator', () => {
        const defaultAttributes = {
            left: 0,
            top: 0,
            rotate: 0,
            hFlip: false,
            vFlip: false
        };

        // Copy of function from src/svg
        function addMissingAttributes(data) {
            let item = Object.assign({}, defaultAttributes, data);
            if (item.inlineHeight === void 0) {
                item.inlineHeight = item.height;
            }
            if (item.inlineTop === void 0) {
                item.inlineTop = item.top;
            }
            if (item.verticalAlign === void 0) {
                // -0.143 if icon is designed for 14px height,
                // otherwise assume icon is designed for 16px height
                item.verticalAlign = item.height % 7 === 0 && item.height % 8 !== 0 ? -0.143 : -0.125;
            }
            return item;
        }

        it('simple SVG icon with default and custom dimensions', () => {
            let data = addMissingAttributes({
                body: '<body />',
                width: 24,
                height: 24
            });

            let result = generateSVG(data, {});
            expect(result).to.be.equal('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1em" height="1em" style="-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><body /></svg>');

            // Custom dimensions
            result = generateSVG(data, {
                width: 48
            });
            expect(result).to.be.equal('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="48" height="48" style="-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><body /></svg>');

            result = generateSVG(data, {
                height: 32
            });
            expect(result).to.be.equal('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="32" height="32" style="-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><body /></svg>');
        });

        it('custom colors and inline icon', () => {
            let data = addMissingAttributes({
                body: '<path d="whatever" fill="currentColor" />',
                width: 20,
                height: 24,
                inlineHeight: 28,
                inlineTop: -2
            });

            let result = generateSVG(data, {});
            expect(result).to.be.equal('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="0.84em" height="1em" style="-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMidYMid meet" viewBox="0 0 20 24"><path d="whatever" fill="currentColor" /></svg>');

            result = generateSVG(data, {
                width: '48',
                color: 'red'
            });
            expect(result).to.be.equal('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="48" height="57.6" style="-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMidYMid meet" viewBox="0 0 20 24"><path d="whatever" fill="red" /></svg>');

            result = generateSVG(data, {
                height: '100%',
                inline: 'true'
            });
            expect(result).to.be.equal('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="71.43%" height="100%" style="vertical-align: -0.125em;-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMidYMid meet" viewBox="0 -2 20 28"><path d="whatever" fill="currentColor" /></svg>');
        });

        it('custom alignment', () => {
            let data = addMissingAttributes({
                body: '<path d="whatever" fill="currentColor" />',
                width: 20,
                height: 24,
                inlineHeight: 28,
                inlineTop: -2
            });

            let result = generateSVG(data, {
                align: 'top',
                width: '50',
                height: '50'
            });
            expect(result).to.be.equal('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50" height="50" style="-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMidYMin meet" viewBox="0 0 20 24"><path d="whatever" fill="currentColor" /></svg>');

            result = generateSVG(data, {
                align: 'left,bottom',
                width: '50',
                height: '50'
            });
            expect(result).to.be.equal('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50" height="50" style="-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMinYMax meet" viewBox="0 0 20 24"><path d="whatever" fill="currentColor" /></svg>');

            result = generateSVG(data, {
                align: 'right,middle,crop',
                width: '50',
                height: '50'
            });
            expect(result).to.be.equal('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50" height="50" style="-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMaxYMid slice" viewBox="0 0 20 24"><path d="whatever" fill="currentColor" /></svg>');
        });

        it('transformations', () => {
            let data = addMissingAttributes({
                body: '<body />',
                width: 20,
                height: 24
            });

            let result = generateSVG(data, {
                rotate: 1
            });
            expect(result).to.be.equal('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1.2em" height="1em" style="-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 20"><g transform="rotate(90 12 12)"><body /></g></svg>');

            result = generateSVG(data, {
                rotate: '180deg'
            });
            expect(result).to.be.equal('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="0.84em" height="1em" style="-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMidYMid meet" viewBox="0 0 20 24"><g transform="rotate(180 10 12)"><body /></g></svg>');

            result = generateSVG(data, {
                rotate: '3'
            });
            expect(result).to.be.equal('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1.2em" height="1em" style="-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 20"><g transform="rotate(-90 10 10)"><body /></g></svg>');

            result = generateSVG(data, {
                rotate: '75%'
            });
            expect(result).to.be.equal('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1.2em" height="1em" style="-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 20"><g transform="rotate(-90 10 10)"><body /></g></svg>');

            result = generateSVG(data, {
                flip: 'Horizontal'
            });
            expect(result).to.be.equal('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="0.84em" height="1em" style="-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMidYMid meet" viewBox="0 0 20 24"><g transform="translate(20 0) scale(-1 1)"><body /></g></svg>');

            result = generateSVG(data, {
                flip: 'ignored, Vertical space-works-as-comma'
            });
            expect(result).to.be.equal('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="0.84em" height="1em" style="-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMidYMid meet" viewBox="0 0 20 24"><g transform="translate(0 24) scale(1 -1)"><body /></g></svg>');
        });
    });
})();
