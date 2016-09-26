'use strict';
/* eslint max-nested-callbacks: 0 */

const Proxyquire = require('proxyquire');
const Async = require('async');
const Hapi = require('hapi');
const Code = require('code');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const beforeEach = lab.beforeEach;
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const internals = {
    server: new Hapi.Server(),
    isDone: false,
    connErr: false,
    errorQuery: (query, next) => {

        return next(new Error('Query Error'));
    },
    defaultQuery: (query, next) => {

        return next(null, { rowCount: 1, rows: [{ id: 1 }] });
    }
};

internals.testRead = internals.testDelete = function (method, expected, done) {

    method(1, (err, result) => {

        expect(err).to.not.exist();
        expect(result).to.equal(expected);

        method('a', (err) => {

            expect(err).to.exist();

            internals.query = internals.errorQuery;

            method(1, (err) => {

                expect(err).to.exist();

                return done();
            });
        });
    });
};

internals.testEdit = function (method, sampleData, done) {

    method(1, sampleData, (err, result) => {

        expect(err).to.not.exist();
        expect(result).to.equal(1);

        method('a', sampleData, (err) => {

            expect(err).to.exist();

            method(1, { foo: 'bar' }, (err) => {

                expect(err).to.exist();

                internals.query = internals.errorQuery;

                method(1, sampleData, (err) => {

                    expect(err).to.exist();

                    internals.query = internals.defaultQuery;

                    return Async.eachOf(sampleData, (value, key, next) => {

                        const singleChange = {};
                        singleChange[key] = value;

                        method(1, singleChange, (err, result) => {

                            expect(err).to.not.exist();
                            expect(result).to.equal(1);

                            return next();
                        });
                    }, done);
                });
            });
        });
    });
};

internals.testAdd = function (method, sampleData, done) {

    method(sampleData.minimum, (err, id) => {

        expect(err).to.not.exist();
        expect(id).to.equal([{ id: 1 }]);

        method(sampleData.complete, (err, id) => {

            expect(err).to.not.exist();
            expect(id).to.equal([{ id: 1 }]);

            method({ foo: 'bar' }, (err) => {

                expect(err).to.exist();

                internals.query = internals.errorQuery;

                method(sampleData.minimum, (err) => {

                    expect(err).to.exist();

                    return done();
                });
            });
        });
    });
};

internals.stub = {
    pg: {
        native: {
            connect: function (connStr, connNext) {

                return connNext(internals.connErr, { query: internals.query }, () => {

                    internals.isDone = true;
                });
            }
        }
    }
};

internals.loadModel = function () {

    return Proxyquire('../lib/models', internals.stub);
};

internals.query = internals.defaultQuery;
internals.models = internals.loadModel();
internals.server.connection();
internals.server.method(internals.models.authorModel);
internals.server.method(internals.models.bookModel);

beforeEach((done) => {

    internals.connErr = false;
    internals.isDone = false;
    internals.query = internals.defaultQuery;

    return done();
});

describe('lib/models', () => {

    it('throws on connection error', (done) => {

        internals.connErr = new Error('Connection Error');

        expect(internals.loadModel).to.throw(/Connection Error/);
        expect(internals.isDone).to.equal(true);

        return done();
    });

    it('throws on query error', (done) => {

        internals.query = internals.errorQuery;

        expect(internals.loadModel).to.throw(/Query Error/);
        expect(internals.isDone).to.equal(true);

        return done();
    });
});

describe('lib/models.authors', () => {

    it('browse authors', (done) => {

        const method = internals.server.methods.author.browse;

        internals.query = (query, next) => {

            return next(null, { rowCount: 1, rows: [{ count: 1 }] });
        };

        method('a', 'penName', 'asc', 1, 1, (err, result) => {

            expect(err).to.not.exist();
            expect(result).to.equal({ pages: 1, page: 1, items: [{ count: 1 }] });

            internals.query = (query, next) => {

                if (query && query.text === 'SELECT COUNT(id) FROM authors ') {

                    return next(null, { rowCount: 1, rows: [{ count: 2 }] });
                }

                return next(new Error('Query Error'));
            };

            method('', 'penName', 'asc', 1, 1, (err) => {

                expect(err).to.exist();

                internals.query = internals.errorQuery;

                method('', 'penName', 'asc', 1, 1, (err) => {

                    expect(err).to.exist();

                    method('', '', '', '', '', (err) => {

                        expect(err).to.exist();

                        method('', '', '', '', 1, (err) => {

                            expect(err).to.exist();

                            method('', '', '', 1, '', (err) => {

                                expect(err).to.exist();

                                method('', '', '', 1, 1, (err) => {

                                    expect(err).to.exist();

                                    method('', '', 'asc', 1, 1, (err) => {

                                        expect(err).to.exist();

                                        return done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it('read authors', (done) => {

        return internals.testRead(internals.server.methods.author.read, [{ id: 1 }], done);
    });

    it('edit authors', (done) => {

        return internals.testEdit(internals.server.methods.author.edit, {
            penName: 'pen',
            lastName: 'last',
            firstName: 'first'
        }, done);
    });

    it('add authors', (done) => {

        return internals.testAdd(internals.server.methods.author.add, {
            minimum: { penName: 'test' },
            complete: {
                penName: 'pen',
                lastName: 'last',
                firstName: 'first'
            }
        }, done);
    });

    it('delete authors', (done) => {

        return internals.testRead(internals.server.methods.author.delete, 1, done);
    });
});

describe('lib/models.books', () => {

    it('browse books', (done) => {

        const method = internals.server.methods.book.browse;

        internals.query = (query, next) => {

            return next(null, { rowCount: 1, rows: [{ count: 1 }] });
        };

        method('', 'title', 'asc', 1, 1, 1, (err, result) => {

            expect(err).to.not.exist();
            expect(result).to.equal({ pages: 1, page: 1, items: [{ count: 1 }] });

            method('a', 'title', 'asc', 1, 1, 1, (err, result) => {

                expect(err).to.not.exist();
                expect(result).to.equal({ pages: 1, page: 1, items: [{ count: 1 }] });

                method('a', 'title', 'asc', 1, 1, null, (err, result) => {

                    expect(err).to.not.exist();
                    expect(result).to.equal({ pages: 1, page: 1, items: [{ count: 1 }] });

                    internals.query = (query, next) => {

                        if (query && query.text.includes('SELECT COUNT(books.id)')) {

                            return next(null, { rowCount: 1, rows: [{ count: 2 }] });
                        }

                        return next(new Error('Query Error'));
                    };

                    method('', 'title', 'asc', 1, 1, null, (err) => {

                        expect(err).to.exist();

                        internals.query = internals.errorQuery;

                        method('', 'title', 'asc', 1, 1, null, (err) => {

                            expect(err).to.exist();

                            method('', '', '', '', '', null, (err) => {

                                expect(err).to.exist();

                                method('', '', '', '', 1, null, (err) => {

                                    expect(err).to.exist();

                                    method('', '', '', 1, '', null, (err) => {

                                        expect(err).to.exist();

                                        method('', '', '', 1, 1, null, (err) => {

                                            expect(err).to.exist();

                                            method('', '', 'asc', 1, 1, null, (err) => {

                                                expect(err).to.exist();

                                                return done();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it('read books', (done) => {

        return internals.testRead(internals.server.methods.book.read, [{ id: 1 }], done);
    });

    it('edit books', (done) => {

        return internals.testEdit(internals.server.methods.book.edit, {
            title: 'title',
            author: 1,
            synopsis: 'synopsis',
            isbn10: 1000000001,
            isbn13: 1000000000001
        }, done);
    });

    it('add books', (done) => {

        return internals.testAdd(internals.server.methods.book.add, {
            minimum: { title: 'test', author: 1 },
            complete: {
                title: 'title',
                author: 1,
                synopsis: 'synopsis',
                isbn10: 1000000001,
                isbn13: 1000000000001
            }
        }, done);
    });

    it('delete books', (done) => {

        return internals.testRead(internals.server.methods.book.delete, 1, done);
    });
});
