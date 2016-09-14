'use strict';

const Joi = require('joi');
const Postgres = require('pg').native;
const Schemas = require('./schemas');
const Config = require('./config');

const internals = {
    query: function (query, next) {

        Postgres.connect(Config.postgresURL, (connErr, client, done) => {

            if (connErr) {
                done();

                return next(connErr);
            }

            client.query(query, (queryErr, result) => {

                done();

                return next(queryErr, result);
            });
        });
    },
    read: function (id, query, next) {

        const err = Schemas.id.validate(id).error;

        if (err) {

            return next(err);
        }

        internals.query({
            text: query,
            values: [id]
        }, (err, result) => {

            if (err) {

                return next(err);
            }

            return next(null, result.rows);
        });
    },
    edit: function (id, schema, data, query, next) {

        const err = schema.validate(data).error ||
            Schemas.id.validate(id).error;

        if (err) {

            return next(err);
        }

        internals.query(query, (err, result) => {

            if (err) {

                return next(err);
            }

            return next(null, result.rowCount);
        });
    },
    add: function (schema, data, query, next) {

        const err = schema.validate(data).error;

        if (err) {

            return next(err);
        }

        internals.query(query, (err, result) => {

            if (err) {

                return next(err);
            }

            return next(null, result.rows);
        });
    },
    delete: function (id, table, next) {

        const err = Schemas.id.validate(id).error;

        if (err) {

            return next(err);
        }

        internals.query({
            text: `DELETE FROM ${table} WHERE id = $1`,
            values: [id]
        }, (err, result) => {

            if (err) {

                return next(err);
            }

            return next(null, result.rowCount);
        });
    }
};

internals.query(`
        CREATE TABLE IF NOT EXISTS authors (
            id               serial PRIMARY KEY,
            penName          varchar (100) NOT NULL,
            lastName         varchar (50),
            firstName        varchar (50)
        );
        CREATE TABLE IF NOT EXISTS books (
            id               serial PRIMARY KEY,
            title            varchar (300) NOT NULL,
            synopsis         varchar (1000),
            isbn10           bigint,
            isbn13           bigint,
            author           int NOT NULL
        );
    `, (err) => {

    if (err) {

        throw err;
    }
});


exports.authorModel = [
    {
        name: 'author.browse',
        method: function (query, sort, order, page, perPage, next) {

            const err = Schemas.page.validate(page).error ||
                Schemas.perPage.validate(perPage).error ||
                Schemas.order.validate(order).error ||
                Schemas.authorSort.validate(sort).error;

            if (err) {

                return next(err);
            }

            const values = [sort, perPage, (page - 1) * perPage];
            let filter = '';
            if (query) {
                values.push(query);
                filter = `WHERE penName like '%$4%' OR
                                lastName like '%$4%' OR
                                firstName like '%$4%' `;
            }

            internals.query({
                text: `SELECT * FROM authors ${filter}ORDER BY $1 ${order} LIMIT $2 OFFSET $3`,
                values: values
            }, (err, result) => {

                if (err) {

                    return next(err);
                }

                return next(null, result.rows);
            });
        }
    },
    {
        name: 'author.read',
        method: function (id, next) {

            return internals.read(id, 'SELECT * FROM authors WHERE id = $1', next);
        }
    },
    {
        name: 'author.edit',
        method: function (id, author, next) {

            const queryValues = [];
            let queryText = 'UPDATE authors SET';

            if (author.hasOwnProperty('penName')) {
                queryValues.push(author.penName);
                queryText = `${queryText} penName = $${queryValues.length}`;
            }

            if (author.hasOwnProperty('lastName')) {
                queryValues.push(author.lastName);
                queryText = `${queryText} lastName = $${queryValues.length}`;
            }

            if (author.hasOwnProperty('firstName')) {
                queryValues.push(author.firstName);
                queryText = `${queryText} firstName = $${queryValues.length}`;
            }

            queryValues.push(id);

            return internals.edit(id, Schemas.author, author, {
                text: `${queryText} WHERE id = $${queryValues.length}`,
                values: queryValues
            }, next);
        }
    },
    {
        name: 'author.add',
        method: function (author, next) {

            return internals.add(Schemas.author.requiredKeys('penName'), author, {
                text: 'INSERT INTO authors (penName, lastName, firstName) VALUES ($1, $2, $3) RETURNING id',
                values: [author.penName, author.lastName, author.firstName]
            }, next);
        }
    },
    {
        name: 'author.delete',
        method: function (id, next) {

            return internals.delete(id, 'authors', next);
        }
    }
];


exports.bookModel = [
    {
        name: 'book.browse',
        method: function (query, sort, order, page, perPage, next) {

            const err = Schemas.page.validate(page).error ||
                Schemas.perPage.validate(perPage).error ||
                Schemas.order.validate(order).error ||
                Schemas.bookSort.validate(sort).error;

            if (err) {

                return next(err);
            }

            const values = [sort, perPage, (page - 1) * perPage];
            let filter = '';

            if (query && query.author) {
                values.push(query.author);
                filter = 'WHERE books.author = $4';
            }
            else if (query && !Joi.string().validate(query).error) {
                values.push(query);
                filter = `WHERE books.title like '%$4%' OR
                                books.isbn10 like '%$4%' OR
                                books.isbn13 like '%$4%' OR
                                books.synopsis like '%$4%'`;
            }

            internals.query({
                text: `SELECT   books.id,
                                books.title, 
                                books.synopsis,
                                books.isbn10,
                                books.isbn13,
                                authors.id as author,
                                authors.penName
                       FROM books INNER JOIN authors
                       ON books.author = authors.id
                       ${filter} ORDER BY $1 ${order} LIMIT $2 OFFSET $3`,
                values: values
            }, (err, result) => {

                if (err) {

                    return next(err);
                }

                return next(null, result.rows);
            });
        }
    },
    {
        name: 'book.read',
        method: function (id, next) {

            return internals.read(id,
                `SELECT books.title,
                        books.synopsis,
                        books.isbn10,
                        books.isbn13,
                        authors.penName
                FROM books INNER JOIN authors
                ON books.author = authors.id
                WHERE books.id = $1`, next);
        }
    },
    {
        name: 'book.edit',
        method: function (id, book, next) {

            const queryValues = [];
            let queryText = 'UPDATE books SET';

            if (book.hasOwnProperty('title')) {
                queryValues.push(book.title);
                queryText = `${queryText} title = $${queryValues.length}`;
            }

            if (book.hasOwnProperty('synopsis')) {
                queryValues.push(book.synopsis);
                queryText = `${queryText} synopsis = $${queryValues.length}`;
            }

            if (book.hasOwnProperty('isbn10')) {
                queryValues.push(book.isbn10);
                queryText = `${queryText} isbn10 = $${queryValues.length}`;
            }

            if (book.hasOwnProperty('isbn13')) {
                queryValues.push(book.isbn13);
                queryText = `${queryText} isbn13 = $${queryValues.length}`;
            }

            if (book.hasOwnProperty('author')) {
                queryValues.push(book.author);
                queryText = `${queryText} author = $${queryValues.length}`;
            }

            queryValues.push(id);

            return internals.edit(id, Schemas.book, book, {
                text: `${queryText} WHERE id = $${queryValues.length}`,
                values: queryValues
            }, next);
        }
    },
    {
        name: 'book.add',
        method: function (book, next) {

            return internals.add(Schemas.book.requiredKeys('title', 'author'), book, {
                text: 'INSERT INTO books (title, synopsis, isbn10, isbn13, author) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                values: [book.title, book.synopsis, book.isbn10, book.isbn13, book.author]
            }, next);
        }
    },
    {
        name: 'book.delete',
        method: function (id, next) {

            return internals.delete(id, 'books', next);
        }
    }
];
