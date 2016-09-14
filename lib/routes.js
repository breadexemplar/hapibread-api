'use strict';

const Schemas = require('./schemas');
const Config = require('./config');

const internals = { apiVersion: `/v${Config.apiVersion}` };
internals.authorsApi = `${internals.apiVersion}/authors`;
internals.booksApi = `${internals.apiVersion}/books`;
internals.authorsApiId = `${internals.authorsApi}/{id}`;
internals.booksApiId = `${internals.booksApi}/{id}`;


exports.authorRoute = [
    {
        path: internals.authorsApi,
        method: 'get',
        handler: { authors: { action: 'browse' } },
        config: {
            validate: {
                query: {
                    find: Schemas.find,
                    sort: Schemas.authorSort,
                    order: Schemas.order,
                    page: Schemas.page,
                    perpage: Schemas.perPage
                }
            }
        }
    },
    {
        path: internals.authorsApiId,
        method: 'get',
        handler: { authors: { action: 'read' } },
        config: { validate: { params: { id: Schemas.id } } }
    },
    {
        path: internals.authorsApiId,
        method: 'patch',
        handler: { authors: { action: 'edit' } },
        config: { validate: { payload: Schemas.author.or('penName', 'lastName', 'firstName'), params: { id: Schemas.id } } }
    },
    {
        path: internals.authorsApi,
        method: 'post',
        handler: { authors: { action: 'add' } },
        config: { validate: { payload: Schemas.author.requiredKeys('penName') } }
    },
    {
        path: internals.authorsApiId,
        method: 'delete',
        handler: { authors: { action: 'delete' } },
        config: { validate: { params: { id: Schemas.id } } }
    },
    {
        path: `${internals.authorsApiId}/books`,
        method: 'get',
        handler: { authors: { action: 'browse', context: 'books' } },
        config: {
            validate: {
                params: { id: Schemas.id },
                query: {
                    find: Schemas.find,
                    sort: Schemas.bookSort,
                    order: Schemas.order,
                    page: Schemas.page,
                    perpage: Schemas.perPage
                }
            }
        }
    }
];


exports.bookRoute = [
    {
        path: internals.booksApi,
        method: 'get',
        handler: { books: { action: 'browse' } },
        config: {
            validate: {
                query: {
                    find: Schemas.find,
                    sort: Schemas.bookSort,
                    order: Schemas.order,
                    page: Schemas.page,
                    perpage: Schemas.perPage
                }
            }
        }
    },
    {
        path: internals.booksApiId,
        method: 'get',
        handler: { books: { action: 'read' } },
        config: { validate: { params: { id: Schemas.id } } }
    },
    {
        path: internals.booksApiId,
        method: 'patch',
        handler: { books: { action: 'edit' } },
        config: { validate: { payload: Schemas.book.or('title', 'synopsis', 'isbn10', 'isbn13', 'author'), params: { id: Schemas.id } } }
    },
    {
        path: internals.booksApi,
        method: 'post',
        handler: { books: { action: 'add' } },
        config: { validate: { payload: Schemas.book.requiredKeys('title', 'author') } }
    },
    {
        path: internals.booksApiId,
        method: 'delete',
        handler: { books: { action: 'delete' } },
        config: { validate: { params: { id: Schemas.id } } }
    }
];
