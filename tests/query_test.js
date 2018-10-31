"use strict";

(() => {
    const chai = require('chai'),
        expect = chai.expect,
        should = chai.should();

    const Collection = require('@iconify/json-tools').Collection,
        parseQuery = require('../src/query');

    let collection1 = new Collection('test');
    collection1.loadJSON({
        prefix: 'test',
        icons: {
            icon1: {
                body: '<icon1 fill="currentColor" />',
                width: 30
            },
            icon2: {
                body: '<icon2 />'
            }
        },
        aliases: {
            alias1: {
                parent: 'icon2',
                hFlip: true
            }
        },
        width: 24,
        height: 24
    });

    let collection2 = new Collection('test2');
    collection2.loadJSON({
        icons: {
            'test2-icon1': {
                body: '<icon1 fill="currentColor" />',
                width: 30
            },
            'test2-icon2': {
                body: '<icon2 />'
            },
            'test2-icon3': {
                body: '<defs><foo id="bar" /></defs><bar use="url(#bar)" fill="currentColor" stroke="currentColor" />'
            }
        },
        aliases: {
            'test2-alias1': {
                parent: 'test2-icon2',
                hFlip: true
            }
        },
        width: 24,
        height: 24
    });

    describe('Testing requests', () => {
        it('icons list', () => {
            // Simple query with prefix
            expect(parseQuery(collection1, 'icons', 'js', {
                icons: 'alias1'
            })).to.be.eql({
                type: 'application/javascript; charset=utf-8',
                body: 'SimpleSVG._loaderCallback({"prefix":"test","icons":{"icon2":{"body":"<icon2 />","width":24,"height":24}},"aliases":{"alias1":{"parent":"icon2","hFlip":true}}})'
            });

            // Query collection without prefix, json
            expect(parseQuery(collection2, 'icons', 'json', {
                icons: 'alias1'
            })).to.be.eql({
                type: 'application/json; charset=utf-8',
                body: '{"prefix":"test2","icons":{"icon2":{"body":"<icon2 />","width":24,"height":24}},"aliases":{"alias1":{"parent":"icon2","hFlip":true}}}'
            });

            // Custom callback
            expect(parseQuery(collection1, 'icons', 'js', {
                icons: 'icon1,icon2',
                callback: 'console.log'
            })).to.be.eql({
                type: 'application/javascript; charset=utf-8',
                body: 'console.log({"prefix":"test","icons":{"icon1":{"body":"<icon1 fill=\\"currentColor\\" />","width":30,"height":24},"icon2":{"body":"<icon2 />","width":24,"height":24}}})'
            });
        });

        it('svg', () => {
            // Simple icon
            expect(parseQuery(collection1, 'icon1', 'svg', {
            })).to.be.eql({
                filename: 'icon1.svg',
                type: 'image/svg+xml; charset=utf-8',
                body: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1.25em" height="1em" style="-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMidYMid meet" viewBox="0 0 30 24"><icon1 fill="currentColor" /></svg>'
            });

            // Icon with custom attributes
            expect(parseQuery(collection2, 'alias1', 'svg', {
                color: 'red'
            })).to.be.eql({
                filename: 'alias1.svg',
                type: 'image/svg+xml; charset=utf-8',
                body: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1em" height="1em" style="-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><g transform="translate(24 0) scale(-1 1)"><icon2 /></g></svg>'
            });

            // Icon with id replacement
            let result = parseQuery(collection2, 'icon3', 'svg', {
                color: 'red',
                rotate: '90deg'
            }).body.replace(/IconifyId-[0-9a-f]+-[0-9a-f]+-[0-9]+/g, 'some-id');

            expect(result).to.be.equal('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1em" height="1em" style="-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><g transform="rotate(90 12 12)"><defs><foo id="some-id" /></defs><bar use="url(#some-id)" fill="red" stroke="red" /></g></svg>');
        });
    });
})();
