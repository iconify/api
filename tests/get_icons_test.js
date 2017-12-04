"use strict";

(() => {
    const Collection = require('../src/collection');

    const chai = require('chai'),
        expect = chai.expect,
        should = chai.should();

    describe('Testing icons list', () => {
        it('several icons', () => {
            let data = {
                prefix: 'foo',
                icons: {
                    icon1: {
                        body: '<icon1 />'
                    },
                    icon2: {
                        body: '<icon2 />'
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
                    }
                },
                width: 20,
                height: 20
            };

            let collection = new Collection();
            collection.loadJSON(data);

            expect(collection.loaded).to.be.equal(true);
            expect(collection.getIcons(['icon1', 'icon3', 'icon20'])).to.be.eql({
                prefix: 'foo',
                icons: {
                    icon1: {
                        body: '<icon1 />',
                        width: 20,
                        height: 20
                    },
                    icon3: {
                        body: '<icon3 />',
                        width: 20,
                        height: 20
                    },
                },
                aliases: {}
            });
        });

        it('icons and aliases', () => {
            let data = {
                prefix: 'foo',
                icons: {
                    icon1: {
                        body: '<icon1 />'
                    },
                    icon2: {
                        body: '<icon2 />'
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
                    }
                },
                width: 20,
                height: 20
            };

            let collection = new Collection();
            collection.loadJSON(data);

            expect(collection.loaded).to.be.equal(true);
            expect(collection.getIcons(['icon2', 'alias1'])).to.be.eql({
                prefix: 'foo',
                icons: {
                    icon1: {
                        body: '<icon1 />',
                        width: 20,
                        height: 20
                    },
                    icon2: {
                        body: '<icon2 />',
                        width: 20,
                        height: 20
                    }
                },
                aliases: {
                    alias1: {
                        parent: 'icon1',
                        rotate: 1
                    }
                }
            });
        });

        it('aliases only', () => {
            let data = {
                prefix: 'foo',
                icons: {
                    icon1: {
                        body: '<icon1 />'
                    },
                    icon2: {
                        body: '<icon2 />'
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
                    }
                },
                width: 20,
                height: 20
            };

            let collection = new Collection();
            collection.loadJSON(data);

            expect(collection.loaded).to.be.equal(true);
            expect(collection.getIcons(['icon20', 'alias1'])).to.be.eql({
                prefix: 'foo',
                icons: {
                    icon1: {
                        body: '<icon1 />',
                        width: 20,
                        height: 20
                    }
                },
                aliases: {
                    alias1: {
                        parent: 'icon1',
                        rotate: 1
                    }
                }
            });
        });

        it('nothing to return', () => {
            let data = {
                prefix: 'foo',
                icons: {
                    icon1: {
                        body: '<icon1 />'
                    },
                    icon2: {
                        body: '<icon2 />'
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

            expect(collection.getIcons(['icon20', 'alias10'])).to.be.eql({
                prefix: 'foo',
                icons: {},
                aliases: {}
            });
        });
    });
})();
