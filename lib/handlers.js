'use strict';

const Boom = require('boom');

const internals = {
    errors: {
        notFound: {
            error: 'Not Found',
            message: 'Id does not exist',
            validation: {
                source: 'params',
                keys: ['id']
            },
            statusCode: 404
        },
        badRequest: {
            error: 'Bad Request',
            message: 'Author is invalid',
            validation: {
                source: 'payload',
                keys: ['author']
            },
            statusCode: 400
        }
    }
};

internals.browse = function (err, results, request, reply) {

    if (err) {
        request.server.log(['error'], err);

        return reply(Boom.badImplementation());
    }

    return reply({
        payload: results,
        statusCode: 200
    }).code(200);
};

internals.read = function (model, request, reply) {

    return model(request.params.id, (err, results) => {

        if (err) {
            request.server.log(['error'], err);

            return reply(Boom.badImplementation());
        }

        if (!results || !results.length) {

            return reply(internals.errors.notFound).code(404);
        }

        return reply({
            payload: results[0],
            statusCode: 200
        }).code(200);
    });
};

internals.edit = function (model, request, reply) {

    return model(request.params.id, request.payload, (err, res) => {

        if (err) {
            request.server.log(['error'], err);

            return reply(Boom.badImplementation());
        }

        if (!res) {

            return reply(internals.errors.notFound).code(404);
        }

        return reply({
            message: 'Edit Success',
            keys: Object.keys(request.payload),
            statusCode: 200
        }).code(200);
    });
};

internals.add = function (model, request, reply) {

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
};

internals.delete = function (model, request, reply) {

    return model(request.params.id, (err, res) => {

        if (err) {
            request.server.log(['error'], err);

            return reply(Boom.badImplementation());
        }

        if (!res) {

            return reply(internals.errors.notFound).code(404);
        }

        return reply().code(204);
    });
};


exports.authorHandler = function (route, options) {

    const action = options.action;
    const context = options.context;

    if (action === 'browse') {

        if (context === 'books') {

            return function (request, reply) {

                const query = request.query;

                return request.server.methods.book.browse(query.find, query.sort, query.order, query.page, query.perpage, request.params.id, (err, results) => {

                    return internals.browse(err, results, request, reply);
                });
            };
        }

        return function (request, reply) {

            const query = request.query;

            return request.server.methods.author.browse(query.find, query.sort, query.order, query.page, query.perpage, (err, results) => {

                return internals.browse(err, results, request, reply);
            });
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

            const query = request.query;

            return request.server.methods.book.browse(query.find, query.sort, query.order, query.page, query.perpage, null, (err, results) => {

                return internals.browse(err, results, request, reply);
            });
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

                    return reply(internals.errors.badRequest).code(400);
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

                    return reply(internals.errors.badRequest).code(400);
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
