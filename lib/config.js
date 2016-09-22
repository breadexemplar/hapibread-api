'use strict';


module.exports = {
    // $lab:coverage:off$
    apiVersion: process.env.API_VERSION || '0',
    port: process.env.PORT || 8080,
    postgresURL: process.env.POSTGRES_URL || 'postgres://postgres:postgres@localhost/postgres'
    // $lab:coverage:on$
};
