'use strict';

const Boom = require('boom');

const internals = {
    browse: function (model, find, request, reply) {

        const query = request.query;

        return model(find, query.sort, query.order, query.page, query.perpage, (err, books) => {

            if (err) {
                request.server.log(['error'], err);

                return reply(Boom.badImplementation());
            }

            return reply({
                payload: books,
                statusCode: 200
            }).code(200);
        });
    },
    read: function (model, request, reply) {

        return model(request.params.id, (err, books) => {

            if (err) {
                request.server.log(['error'], err);

                return reply(Boom.badImplementation());
            }

            if (!books || !books.length) {

                return reply({
                    error: 'Not Found',
                    message: 'Id does not exist',
                    validation: {
                        source: 'params',
                        keys: ['id']
                    },
                    statusCode: 404
                }).code(404);
            }

            return reply({
                payload: books[0],
                statusCode: 200
            }).code(200);
        });
    },
    edit: function (model, request, reply) {

        return model(request.params.id, request.payload, (err, res) => {

            if (err) {
                request.server.log(['error'], err);

                return reply(Boom.badImplementation());
            }

            if (!res) {

                return reply({
                    error: 'Not Found',
                    message: 'Id does not exist',
                    validation: {
                        source: 'params',
                        keys: ['id']
                    },
                    statusCode: 404
                }).code(404);
            }

            return reply({
                message: 'Edit Success',
                keys: Object.keys(request.payload),
                statusCode: 200
            }).code(200);
        });
    },
    add: function (model, request, reply) {

        return model(request.payload, (err, id) => {

            if (err || !id) {
                request.server.log(['error'], err);

                return reply(Boom.badImplementation());
            }

            return reply({
                message: 'Add Success',
                id: id,
                statusCode: 201
            }).code(201);
        });
    },
    delete: function (model, request, reply) {

        return model(request.params.id, (err, res) => {

            if (err) {
                request.server.log(['error'], err);

                return reply(Boom.badImplementation());
            }

            if (!res) {

                return reply({
                    error: 'Not Found',
                    message: 'Id does not exist',
                    validation: {
                        source: 'params',
                        keys: ['id']
                    },
                    statusCode: 404
                }).code(404);
            }

            return reply().code(204);
        });
    }
};


exports.authorHandler = function (route, options) {

    const action = options.action;
    const context = options.context;

    if (action === 'browse') {

        if (context === 'books') {

            return function (request, reply) {

                return internals.browse(request.server.methods.book.browse, { author: request.params.id }, request, reply);
            };
        }

        return function (request, reply) {

            return internals.browse(request.server.methods.author.browse, request.query.find, request, reply);
        };
    }
    else if (action === 'read') {

        return function (request, reply) {

            return internals.read(request.server.methods.author.read, request, reply);
        };
    }
    else if (action === 'edit') {

        return function (request, reply) {

            return internals.edit(request.server.methods.author.edit, request, reply);
        };
    }
    else if (action === 'add') {

        return function (request, reply) {

            return internals.add(request.server.methods.author.add, request, reply);
        };
    }
    else if (action === 'delete') {

        return function (request, reply) {

            return internals.delete(request.server.methods.author.delete, request, reply);
        };
    }
};


exports.bookHandler = function (route, options) {

    const action = options.action;

    if (action === 'browse') {

        return function (request, reply) {

            return internals.browse(request.server.methods.book.browse, request.query.find, request, reply);
        };
    }
    else if (action === 'read') {

        return function (request, reply) {

            return internals.read(request.server.methods.book.read, request, reply);
        };
    }
    else if (action === 'edit') {

        return function (request, reply) {

            return request.server.methods.author.read(request.payload.author, (err, author) => {

                if (err) {
                    request.server.log(['error'], err);

                    return reply(Boom.badImplementation());
                }

                if (!author || !author.penName) {

                    return reply({
                        error: 'Bad Request',
                        message: 'Author is invalid',
                        validation: {
                            source: 'payload',
                            keys: ['author']
                        },
                        statusCode: 400
                    }).code(400);
                }

                return internals.edit(request.server.methods.book.edit, request, reply);
            });
        };
    }
    else if (action === 'add') {

        return function (request, reply) {

            return request.server.methods.author.read(request.payload.author, (err, author) => {

                if (err) {
                    request.server.log(['error'], err);

                    return reply(Boom.badImplementation());
                }

                if (!author || !author.penName) {

                    return reply({
                        error: 'Bad Request',
                        message: 'Author is invalid',
                        validation: {
                            source: 'payload',
                            keys: ['author']
                        },
                        statusCode: 400
                    }).code(400);
                }

                return internals.add(request.server.methods.book.add, request, reply);
            });
        };
    }
    else if (action === 'delete') {

        return function (request, reply) {

            return internals.delete(request.server.methods.book.delete, request, reply);
        };
    }
};
