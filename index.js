'use strict';

const Server = require('./lib/server');

Server.start((err) => {

    if (err) {
        throw err;
    }

    Server.log([], `Server started at ${Server.info.uri}`);
});
