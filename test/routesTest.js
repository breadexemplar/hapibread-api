'use strict';

const Proxyquire = require('proxyquire');
const Hapi = require('hapi');
const Code = require('code');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const internals = { version: 0 };
internals.apiVersion = `/v${internals.version}`;
internals.authorsApi = `${internals.apiVersion}/authors`;
internals.booksApi = `${internals.apiVersion}/books`;
internals.authorsApiId = `${internals.authorsApi}/1`;
internals.booksApiId = `${internals.booksApi}/1`;
internals.authorsApiIdErr = `${internals.authorsApi}/foo`;
internals.booksApiIdErr = `${internals.booksApi}/foo`;

internals.handler = function (route, options) {

    return function (request, reply) {

        return reply({
            action: options.action,
            context: options.context
        });
    };
};

internals.routes = Proxyquire('../lib/routes', { './config': { apiVersion: internals.version } });
internals.server = new Hapi.Server();
internals.server.connection();
internals.server.handler('authors', internals.handler);
internals.server.handler('books', internals.handler);
internals.server.route(internals.routes.authorRoute);
internals.server.route(internals.routes.bookRoute);

internals.runTests = function (tests) {

    for (let i = 0; i < tests.length; ++i) {

        const test = tests[i];
        const request = test.request;

        it(`accepts ${request.method} ${request.url}`, (done) => {

            internals.server.inject(request, (res) => {

                expect(res.statusCode).to.equal(test.statusCode);
                expect(res.result).to.equal(test.result);

                return done();
            });
        });
    }
};

internals.errors = {
    badRequest: {
        fooQuery: {
            statusCode: 400,
            error: 'Bad Request',
            message: '"foo" is not allowed',
            validation: { source: 'query', keys: ['foo'] }
        },
        fooPayload: {
            statusCode: 400,
            error: 'Bad Request',
            message: '"foo" is not allowed',
            validation: { source: 'payload', keys: ['foo'] }
        },
        id: {
            statusCode: 400,
            error: 'Bad Request',
            message: 'child "id" fails because ["id" must be a number]',
            validation: { source: 'params', keys: ['id'] }
        },
        penName: {
            statusCode: 400,
            error: 'Bad Request',
            message: 'child "penName" fails because ["penName" is required]',
            validation: { source: 'payload', keys: ['penName'] }
        },
        author: {
            statusCode: 400,
            error: 'Bad Request',
            message: 'child "author" fails because ["author" is required]',
            validation: { source: 'payload', keys: ['author'] }
        },
        title: {
            statusCode: 400,
            error: 'Bad Request',
            message: 'child "title" fails because ["title" is required]',
            validation: { source: 'payload', keys: ['title'] }
        }
    }
};

internals.authorRouteTests = [
    {
        request: { method: 'get', url: `${internals.authorsApi}?sort=penName&order=asc&page=1&perpage=1` },
        result: { action: 'browse', context: undefined },
        statusCode: 200
    },
    {
        request: { method: 'get', url: `${internals.authorsApi}?find=test&sort=penName&order=asc&page=1&perpage=1` },
        result: { action: 'browse', context: undefined },
        statusCode: 200
    },
    {
        request: { method: 'get', url: `${internals.authorsApi}?foo=bar&sort=penName&order=asc&page=1&perpage=1` },
        result: internals.errors.badRequest.fooQuery,
        statusCode: 400
    },
    {
        request: { method: 'get', url: internals.authorsApiId },
        result: { action: 'read', context: undefined },
        statusCode: 200
    },
    {
        request: { method: 'get', url: internals.authorsApiIdErr },
        result: internals.errors.badRequest.id,
        statusCode: 400
    },
    {
        request: { method: 'patch', url: internals.authorsApiId, payload: { penName: 'newPenName' } },
        result: { action: 'edit', context: undefined },
        statusCode: 200
    },
    {
        request: { method: 'patch', url: internals.authorsApiId, payload: {} },
        result: {
            statusCode: 400,
            error: 'Bad Request',
            message: '"value" must contain at least one of [penName, lastName, firstName]',
            validation: { source: 'payload', keys: ['value'] }
        },
        statusCode: 400
    },
    {
        request: { method: 'patch', url: internals.authorsApiIdErr, payload: { penName: 'newPenName' } },
        result: internals.errors.badRequest.id,
        statusCode: 400
    },
    {
        request: { method: 'patch', url: internals.authorsApiId, payload: { foo: 'bar', penName: 'newPenName' } },
        result: internals.errors.badRequest.fooPayload,
        statusCode: 400
    },
    {
        request: { method: 'post', url: internals.authorsApi, payload: { penName: 'pen' } },
        result: { action: 'add', context: undefined },
        statusCode: 200
    },
    {
        request: { method: 'post', url: internals.authorsApi, payload: { foo: 'bar' } },
        result: internals.errors.badRequest.penName,
        statusCode: 400
    },
    {
        request: { method: 'post', url: internals.authorsApi, payload: {} },
        result: internals.errors.badRequest.penName,
        statusCode: 400
    },
    {
        request: { method: 'delete', url: internals.authorsApiId },
        result: { action: 'delete', context: undefined },
        statusCode: 200
    },
    {
        request: { method: 'delete', url: internals.authorsApiIdErr },
        result: internals.errors.badRequest.id,
        statusCode: 400
    },
    {
        request: { method: 'get', url: `${internals.authorsApiId}/books?sort=title&order=asc&page=1&perpage=1` },
        result: { action: 'browse', context: 'books' },
        statusCode: 200
    },
    {
        request: { method: 'get', url: `${internals.authorsApiId}/books?find=test&sort=title&order=asc&page=1&perpage=1` },
        result: { action: 'browse', context: 'books' },
        statusCode: 200
    }
];

internals.bookRouteTests = [
    {
        request: { method: 'get', url: `${internals.booksApi}?sort=title&order=asc&page=1&perpage=1` },
        result: { action: 'browse', context: undefined },
        statusCode: 200
    },
    {
        request: { method: 'get', url: `${internals.booksApi}?find=test&sort=title&order=asc&page=1&perpage=1` },
        result: { action: 'browse', context: undefined },
        statusCode: 200
    },
    {
        request: { method: 'get', url: `${internals.booksApi}?foo=bar&sort=title&order=asc&page=1&perpage=1` },
        result: internals.errors.badRequest.fooQuery,
        statusCode: 400
    },
    {
        request: { method: 'get', url: internals.booksApiId },
        result: { action: 'read', context: undefined },
        statusCode: 200
    },
    {
        request: { method: 'get', url: internals.booksApiIdErr },
        result: internals.errors.badRequest.id,
        statusCode: 400
    },
    {
        request: { method: 'patch', url: internals.booksApiId, payload: { title: 'newTitle' } },
        result: { action: 'edit', context: undefined },
        statusCode: 200
    },
    {
        request: { method: 'patch', url: internals.booksApiId, payload: {} },
        result: {
            statusCode: 400,
            error: 'Bad Request',
            message: '"value" must contain at least one of [title, synopsis, isbn10, isbn13, author]',
            validation: { source: 'payload', keys: ['value'] }
        },
        statusCode: 400
    },
    {
        request: { method: 'patch', url: internals.booksApiId, payload: { foo: 'bar', title: 'newTitle' } },
        result: internals.errors.badRequest.fooPayload,
        statusCode: 400
    },
    {
        request: { method: 'patch', url: internals.booksApiIdErr, payload: { title: 'newTitle' } },
        result: internals.errors.badRequest.id,
        statusCode: 400
    },
    {
        request: { method: 'post', url: internals.booksApi, payload: { title: 'title', author: 1234 } },
        result: { action: 'add', context: undefined },
        statusCode: 200
    },
    {
        request: { method: 'post', url: internals.booksApi, payload: { title: 'title' } },
        result: internals.errors.badRequest.author,
        statusCode: 400
    },
    {
        request: { method: 'post', url: internals.booksApi, payload: { foo: 'bar' } },
        result: internals.errors.badRequest.title,
        statusCode: 400
    },
    {
        request: { method: 'delete', url: internals.booksApiId },
        result: { action: 'delete', context: undefined },
        statusCode: 200
    },
    {
        request: { method: 'delete', url: internals.booksApiIdErr },
        result: internals.errors.badRequest.id,
        statusCode: 400
    }
];

describe('lib/routes/authorRoute', () => {

    internals.runTests(internals.authorRouteTests);
});

describe('lib/routes/bookRoute', () => {

    internals.runTests(internals.bookRouteTests);
});
