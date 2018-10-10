"use strict";

(() => {
    const Collection = require('../src/collection');

    const chai = require('chai'),
        expect = chai.expect,
        should = chai.should();

    describe('Testing loading collection', () => {
        it('loading collection with prefix', () => {
            let data = {
                prefix: 'foo',
                icons: {
                    bar: {
                        body: '<bar />',
                        width: 20,
                        height: 20
                    },
                    baz: {
                        body: '<baz />',
                        width: 30,
                        height: 40
                    }
                },
                aliases: {
                    baz90: {
                        parent: 'baz',
                        rotate: 1
                    }
                }
            };

            let collection = new Collection();
            collection.loadJSON(data); // loadQueue as object

            expect(collection.loaded).to.be.equal(true);
            expect(collection.prefix).to.be.equal('foo');
            expect(collection.icons.bar).to.be.eql(data.icons.bar);
        });

        it('loading collection without prefix', () => {
            let data = {
                icons: {
                    'foo-bar': {
                        body: '<bar />',
                        width: 20,
                        height: 20
                    },
                    'foo-baz': {
                        body: '<baz />',
                        width: 30,
                        height: 40
                    }
                },
                aliases: {
                    'foo-baz90': {
                        parent: 'foo-baz',
                        rotate: 1
                    }
                }
            };

            let collection = new Collection('foo');
            collection.loadJSON(JSON.stringify(data)); // loadQueue as string

            expect(collection.loaded).to.be.equal(true);
            expect(collection.prefix).to.be.equal('foo');
            expect(Object.keys(collection.icons)).to.be.eql(['bar', 'baz']);
        });

        it('loading collection without detectable prefix', () => {
            let data = {
                icons: {
                    'foo-bar': {
                        body: '<bar />',
                        width: 20,
                        height: 20
                    },
                    'foo-baz': {
                        body: '<baz />',
                        width: 30,
                        height: 40
                    }
                },
                aliases: {
                    'foo-baz90': {
                        parent: 'foo-baz',
                        rotate: 1
                    }
                }
            };

            let collection = new Collection();
            collection.loadJSON(data);

            expect(collection.loaded).to.be.equal(false);
            expect(collection.prefix).to.be.equal(null);
        });

        it('optimized collection', () => {
            let data = {
                prefix: 'foo',
                icons: {
                    bar: {
                        body: '<bar />',
                        height: 20
                    },
                    baz: {
                        body: '<baz />'
                    }
                },
                aliases: {
                    baz90: {
                        parent: 'baz',
                        rotate: 1
                    }
                },
                width: 30,
                height: 40
            };

            let collection = new Collection();
            collection.loadJSON(data);

            expect(collection.loaded).to.be.equal(true);
            expect(collection.prefix).to.be.equal('foo');
            expect(collection.icons.bar).to.be.eql({
                body: '<bar />',
                height: 20,
                width: 30
            });
            expect(collection.icons.baz).to.be.eql({
                body: '<baz />',
                width: 30,
                height: 40
            });
        });
    });
})();
