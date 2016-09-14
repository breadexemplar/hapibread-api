'use strict';

const Handlers = require('../lib/handlers');

const Hapi = require('hapi');
const Code = require('code');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const beforeEach = lab.beforeEach;
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const internals = {
    server: new Hapi.Server({ debug: false }),
    authorModel: { err: null, res: null },
    bookModel: { err: null, res: null }
};

internals.testAuthorModel = function (...args) {

    return args[args.length - 1](internals.authorModel.err, internals.authorModel.res);
};

internals.testBookModel = function (...args) {

    return args[args.length - 1](internals.bookModel.err, internals.bookModel.res);
};

internals.authorsPath = '/authors';
internals.booksPath = '/books';
internals.authorsIdPath = `${internals.authorsPath}/{id}`;
internals.booksIdPath = `${internals.booksPath}/{id}`;

internals.methods = [
    { method: internals.testAuthorModel, name: 'author.browse' },
    { method: internals.testAuthorModel, name: 'author.read' },
    { method: internals.testAuthorModel, name: 'author.edit' },
    { method: internals.testAuthorModel, name: 'author.add' },
    { method: internals.testAuthorModel, name: 'author.delete' },
    { method: internals.testBookModel, name: 'book.browse' },
    { method: internals.testBookModel, name: 'book.read' },
    { method: internals.testBookModel, name: 'book.edit' },
    { method: internals.testBookModel, name: 'book.add' },
    { method: internals.testBookModel, name: 'book.delete' }
];

internals.server.connection();
internals.server.method(internals.methods);
internals.server.handler('authors', Handlers.authorHandler);
internals.server.handler('books', Handlers.bookHandler);
internals.server.route([
    { path: internals.authorsPath, method: 'get', handler: { authors: { action: 'browse' } } },
    { path: internals.authorsIdPath, method: 'get', handler: { authors: { action: 'read' } } },
    { path: internals.authorsIdPath, method: 'patch', handler: { authors: { action: 'edit' } } },
    { path: internals.authorsPath, method: 'post', handler: { authors: { action: 'add' } } },
    { path: internals.authorsIdPath, method: 'delete', handler: { authors: { action: 'delete' } } },
    { path: `${internals.authorsIdPath}/books`, method: 'get', handler: { authors: { action: 'browse', context: 'books' } } },
    { path: `/foo${internals.authorsPath}`, method: 'get', handler: { authors: { action: 'foobar' } } },
    { path: internals.booksPath, method: 'get', handler: { books: { action: 'browse' } } },
    { path: internals.booksIdPath, method: 'get', handler: { books: { action: 'read' } } },
    { path: internals.booksIdPath, method: 'patch', handler: { books: { action: 'edit' } } },
    { path: internals.booksPath, method: 'post', handler: { books: { action: 'add' } } },
    { path: internals.booksIdPath, method: 'delete', handler: { books: { action: 'delete' } } },
    { path: `/foo${internals.booksPath}`, method: 'get', handler: { books: { action: 'foobar' } } }
]);

internals.runTests = function (tests) {

    for (let i = 0; i < tests.length; ++i) {

        const test = tests[i];
        const request = test.request;
        const bookErr = test.bookModel && test.bookModel.err;
        const authorErr = test.authorModel && test.authorModel.err;

        request.url = request.url.replace('{id}', '1');

        it(`handles ${request.method} ${request.url} - author err:${authorErr} book err:${bookErr}`, (done) => {

            internals.authorModel = test.authorModel;
            internals.bookModel = test.bookModel;
            internals.server.inject(request, (res) => {

                expect(res.statusCode).to.equal(test.statusCode);
                expect(res.result).to.equal(test.result);

                return done();
            });
        });
    }
};

internals.errors = {
    badImplementation: {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An internal server error occurred'
    }
};

internals.authorHandlerTests = [
    {
        request: { url: internals.authorsPath, method: 'get' },
        authorModel: { err: null, res: [] },
        result: { payload: [], statusCode: 200 },
        statusCode: 200
    },
    {
        request: { url: internals.authorsPath, method: 'get' },
        authorModel: { err: true, res: [] },
        result: internals.errors.badImplementation,
        statusCode: 500
    },
    {
        request: { url: internals.authorsIdPath, method: 'get' },
        authorModel: { err: null, res: {} },
        result: { payload: {}, statusCode: 200 },
        statusCode: 200
    },
    {
        request: { url: internals.authorsIdPath, method: 'get' },
        authorModel: { err: true, res: {} },
        result: internals.errors.badImplementation,
        statusCode: 500
    },
    {
        request: { url: internals.authorsIdPath, method: 'patch', payload: {} },
        authorModel: { err: null, res: 1 },
        result: { message: 'Edit Success', keys: [], statusCode: 200 },
        statusCode: 200
    },
    {
        request: { url: internals.authorsIdPath, method: 'patch', payload: {} },
        authorModel: { err: true, res: null },
        result: internals.errors.badImplementation,
        statusCode: 500
    },
    {
        request: { url: internals.authorsIdPath, method: 'patch', payload: {} },
        authorModel: { err: null, res: 0 },
        result: { message: 'Id not found', keys: ['id'], statusCode: 404 },
        statusCode: 404
    },
    {
        request: { url: internals.authorsPath, method: 'post', payload: {} },
        authorModel: { err: null, res: 1 },
        result: { message: 'Add Success', id: 1, statusCode: 201 },
        statusCode: 201
    },
    {
        request: { url: internals.authorsPath, method: 'post', payload: {} },
        authorModel: { err: true, res: null },
        result: internals.errors.badImplementation,
        statusCode: 500
    },
    {
        request: { url: internals.authorsIdPath, method: 'delete' },
        authorModel: { err: null, res: 1 },
        result: null,
        statusCode: 204
    },
    {
        request: { url: internals.authorsIdPath, method: 'delete' },
        authorModel: { err: true, res: null },
        result: internals.errors.badImplementation,
        statusCode: 500
    },
    {
        request: { url: internals.authorsIdPath, method: 'delete' },
        authorModel: { err: null, res: 0 },
        result: { message: 'Id not found', keys: ['id'], statusCode: 404 },
        statusCode: 404
    },
    {
        request: { url: `${internals.authorsIdPath}/books`, method: 'get' },
        bookModel: { err: null, res: [] },
        result: { payload: [], statusCode: 200 },
        statusCode: 200
    },
    {
        request: { url: `${internals.authorsIdPath}/books`, method: 'get' },
        bookModel: { err: true, res: [] },
        result: internals.errors.badImplementation,
        statusCode: 500
    }
];

internals.bookHandlerTests = [
    {
        request: { url: internals.booksPath, method: 'get' },
        bookModel: { err: null, res: [] },
        result: { payload: [], statusCode: 200 },
        statusCode: 200
    },
    {
        request: { url: internals.booksPath, method: 'get' },
        bookModel: { err: true, res: [] },
        result: internals.errors.badImplementation,
        statusCode: 500
    },
    {
        request: { url: internals.booksIdPath, method: 'get' },
        bookModel: { err: null, res: {} },
        result: { payload: {}, statusCode: 200 },
        statusCode: 200
    },
    {
        request: { url: internals.booksIdPath, method: 'get' },
        bookModel: { err: true, res: {} },
        result: internals.errors.badImplementation,
        statusCode: 500
    },
    {
        request: { url: internals.booksIdPath, method: 'patch', payload: {} },
        authorModel: { err: null, res: { penName: true } },
        bookModel: { err: null, res: 1 },
        result: { message: 'Edit Success', keys: [], statusCode: 200 },
        statusCode: 200
    },
    {
        request: { url: internals.booksIdPath, method: 'patch', payload: {} },
        authorModel: { err: null, res: null },
        bookModel: { err: null, res: 1 },
        result: { message: 'Author is invalid', keys: ['author'], statusCode: 400 },
        statusCode: 400
    },
    {
        request: { url: internals.booksIdPath, method: 'patch', payload: {} },
        authorModel: { err: null, res: {} },
        bookModel: { err: null, res: 1 },
        result: { message: 'Author is invalid', keys: ['author'], statusCode: 400 },
        statusCode: 400
    },
    {
        request: { url: internals.booksIdPath, method: 'patch', payload: {} },
        bookModel: { err: true, res: null },
        result: internals.errors.badImplementation,
        statusCode: 500
    },
    {
        request: { url: internals.booksIdPath, method: 'patch', payload: {} },
        authorModel: { err: true, res: null },
        bookModel: { err: null, res: 1 },
        result: internals.errors.badImplementation,
        statusCode: 500
    },
    {
        request: { url: internals.booksIdPath, method: 'patch', payload: {} },
        authorModel: { err: null, res: { penName: true } },
        bookModel: { err: null, res: 0 },
        result: { message: 'Id not found', keys: ['id'], statusCode: 404 },
        statusCode: 404
    },
    {
        request: { url: internals.booksPath, method: 'post', payload: {} },
        authorModel: { err: null, res: { penName: true } },
        bookModel: { err: null, res: 1 },
        result: { message: 'Add Success', id: 1, statusCode: 201 },
        statusCode: 201
    },
    {
        request: { url: internals.booksPath, method: 'post', payload: {} },
        authorModel: { err: null, res: null },
        bookModel: { err: null, res: 1 },
        result: { message: 'Author is invalid', keys: ['author'], statusCode: 400 },
        statusCode: 400
    },
    {
        request: { url: internals.booksPath, method: 'post', payload: {} },
        authorModel: { err: null, res: {} },
        bookModel: { err: null, res: 1 },
        result: { message: 'Author is invalid', keys: ['author'], statusCode: 400 },
        statusCode: 400
    },
    {
        request: { url: internals.booksPath, method: 'post', payload: {} },
        bookModel: { err: true, res: null },
        result: internals.errors.badImplementation,
        statusCode: 500
    },
    {
        request: { url: internals.booksPath, method: 'post', payload: {} },
        authorModel: { err: true, res: null },
        bookModel: { err: null, res: null },
        result: internals.errors.badImplementation,
        statusCode: 500
    },
    {
        request: { url: internals.booksIdPath, method: 'delete' },
        bookModel: { err: null, res: 1 },
        result: null,
        statusCode: 204
    },
    {
        request: { url: internals.booksIdPath, method: 'delete' },
        bookModel: { err: true, res: null },
        result: internals.errors.badImplementation,
        statusCode: 500
    },
    {
        request: { url: internals.booksIdPath, method: 'delete' },
        bookModel: { err: null, res: 0 },
        result: { message: 'Id not found', keys: ['id'], statusCode: 404 },
        statusCode: 404
    }
];

beforeEach((done) => {

    internals.authorModel = { err: null, res: null };
    internals.bookModel = { err: null, res: null };

    return done();
});

describe('lib/handlers.authors', () => {

    internals.runTests(internals.authorHandlerTests);
});

describe('lib/handlers.books', () => {

    internals.runTests(internals.bookHandlerTests);
});
