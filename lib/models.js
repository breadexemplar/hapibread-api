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
    validateBrowseArgs: function (sortSchema, sort, order, page, perPage) {

        return Schemas.page.validate(page).error ||
            Schemas.perPage.validate(perPage).error ||
            Schemas.order.validate(order).error ||
            sortSchema.validate(sort).error;
    },
    browse: function (query1, query2, values, perPage, page, next) {

        internals.query({
            text: query1,
            values: []
        }, (err, total) => {

            if (err) {

                return next(err);
            }

            const pages = Math.ceil(total.rows[0].count / perPage) || 1;

            internals.query({
                text: query2,
                values: values
            }, (err, result) => {

                if (err) {

                    return next(err);
                }

                return next(null, {
                    page: (pages < page) ? pages : page,
                    pages: pages,
                    items: result.rows
                });
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
    edit: function (id, schema, data, context, props, next) {

        const err = schema.validate(data).error || Schemas.id.validate(id).error;
        const values = [];
        let text = `UPDATE ${context} SET`;

        if (err) {

            return next(err);
        }

        for (let i = 0; i < props.length; ++i) {

            if (data.hasOwnProperty(props[i])) {
                values.push(data[props[i]]);
                text = `${text} ${props[i]} = $${values.length}`;
            }
        }

        values.push(id);

        internals.query({
            text: `${text} WHERE id = $${values.length}`,
            values: values
        }, (err, result) => {

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

            const err = internals.validateBrowseArgs(Schemas.authorSort, sort, order, page, perPage);

            if (err) {

                return next(err);
            }

            const values = [sort, perPage, (page - 1) * perPage];
            let filter = '';
            if (query) {
                filter = `WHERE penName like '%${query}%' OR
                                lastName like '%${query}%' OR
                                firstName like '%${query}%' `;
            }

            internals.browse(
                `SELECT COUNT(id) FROM authors ${filter}`,
                `SELECT * FROM authors ${filter}ORDER BY $1 ${order} LIMIT $2 OFFSET $3`,
                values, perPage, page, next
            );
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

            return internals.edit(id, Schemas.author, author, 'authors', ['penName', 'lastName', 'firstName'], next);
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
        method: function (query, sort, order, page, perPage, author, next) {

            const err = internals.validateBrowseArgs(Schemas.bookSort, sort, order, page, perPage);

            if (err) {

                return next(err);
            }

            const values = [sort, perPage, (page - 1) * perPage];
            let filter = '';
            let filterCount = '';

            if (author && !Schemas.id.validate(author).error) {
                values.push(author);
                filter = `books.author = $${values.length}`;
            }

            if (query && !Joi.string().validate(query).error) {
                if (filter) {
                    filter = `${filter} AND`;
                }
                filter = `${filter} books.title like '%${query}%' OR
                                    books.synopsis like '%${query}%'`;
            }

            if (filter) {
                filter = `WHERE ${filter}`;
                filterCount = filter.replace(` = $${values.length}`, ` = ${author}`);
            }

            internals.browse(
                `SELECT COUNT(books.id)
                        FROM books INNER JOIN authors
                        ON books.author = authors.id
                       ${filterCount}`,
                `SELECT books.id,
                        books.title, 
                        books.synopsis,
                        books.isbn10,
                        books.isbn13,
                        authors.id as author,
                        authors.penName
                FROM books INNER JOIN authors
                ON books.author = authors.id
                ${filter} ORDER BY $1 ${order} LIMIT $2 OFFSET $3`,
                values, perPage, page, next
            );
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

            return internals.edit(id, Schemas.book, book, 'books', ['title', 'synopsis', 'isbn10', 'isbn13', 'author'], next);
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
