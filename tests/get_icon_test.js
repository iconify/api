"use strict";

(() => {
    const Collection = require('../src/collection');

    const chai = require('chai'),
        expect = chai.expect,
        should = chai.should();

    describe('Testing icon data', () => {
        it('simple icon', () => {
            let data = {
                prefix: 'foo',
                icons: {
                    icon1: {
                        body: '<icon1 />'
                    },
                    icon2: {
                        body: '<icon2 />',
                        width: 30,
                        left: -10,
                        top: -5
                    },
                    icon3: {
                        body: '<icon3 />'
                    },
                    icon4: {
                        body: '<icon4 />'
                    }
                },
                width: 20,
                height: 20
            };

            let collection = new Collection();
            collection.loadJSON(data);

            expect(collection.loaded).to.be.equal(true);
            expect(collection.getIcon('icon1')).to.be.eql({
                body: '<icon1 />',
                left: 0,
                top: 0,
                width: 20,
                height: 20,
                inlineHeight: 20,
                hFlip: false,
                vFlip: false,
                rotate: 0,
                inlineTop: 0,
                verticalAlign: -0.125
            });

            expect(collection.getIcon('icon2')).to.be.eql({
                body: '<icon2 />',
                left: -10,
                top: -5,
                width: 30,
                height: 20,
                inlineHeight: 20,
                hFlip: false,
                vFlip: false,
                rotate: 0,
                inlineTop: -5,
                verticalAlign: -0.125
            });
        });

        it('alias', () => {
            let data = {
                prefix: 'foo',
                icons: {
                    icon1: {
                        body: '<icon1 />'
                    },
                    icon2: {
                        body: '<icon2 />',
                        rotate: 3,
                        hFlip: true,
                        vFlip: true,
                        top: -3
                    },
                    icon3: {
                        body: '<icon3 />'
                    },
                    icon4: {
                        body: '<icon4 />'
                    }
                },
                aliases: {
                    alias1: {
                        parent: 'icon1',
                        rotate: 1
                    },
                    alias2: {
                        parent: 'icon2',
                        rotate: 2,
                        hFlip: true,
                        width: 30,
                        height: 28 // verticalAlign should be -1/7
                    },
                    alias3: {
                        parent: 'missing-icon'
                    },
                    alias4: {
                        parent: 'alias5'
                    },
                    alias5: {
                        parent: 'alias4'
                    }
                },
                width: 20,
                height: 20
            };

            let collection = new Collection();
            collection.loadJSON(data);

            expect(collection.loaded).to.be.equal(true);

            // Simple alias
            expect(collection.getIcon('alias1')).to.be.eql({
                body: '<icon1 />',
                parent: 'icon1', // Leftover from merging objects
                left: 0,
                top: 0,
                width: 20,
                height: 20,
                inlineHeight: 20,
                hFlip: false,
                vFlip: false,
                rotate: 1,
                inlineTop: 0,
                verticalAlign: -0.125
            });

            // Alias with overwritten properties
            expect(collection.getIcon('alias2')).to.be.eql({
                body: '<icon2 />',
                parent: 'icon2', // Leftover from merging objects
                left: 0,
                top: -3,
                width: 30,
                height: 28,
                inlineHeight: 28, // same as height
                hFlip: false,
                vFlip: true,
                rotate: 5,
                inlineTop: -3, // same as top
                verticalAlign: -0.143
            });

            // Alias that has no parent
            expect(collection.getIcon('alias3')).to.be.equal(null);

            // Infinite loop
            expect(collection.getIcon('alias4')).to.be.equal(null);

            // No such icon/alias
            expect(collection.getIcon('whatever')).to.be.equal(null);
        });
    });
})();
