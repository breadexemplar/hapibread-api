'use strict';

const Hapi = require('hapi');

const Config = require('./config');
const Models = require('./models');
const Handlers = require('./handlers');
const Routes = require('./routes');

const server = new Hapi.Server();

server.connection({ port: Config.port });

server.method(Models.authorModel);
server.method(Models.bookModel);

server.handler('authors', Handlers.authorHandler);
server.handler('books', Handlers.bookHandler);

server.route(Routes.authorRoute);
server.route(Routes.bookRoute);


module.exports = server;
