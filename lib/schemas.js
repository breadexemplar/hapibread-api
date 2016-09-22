'use strict';

const Joi = require('joi');


module.exports = {
    author: Joi.object().keys({
        penName: Joi.string().min(2).max(100),
        lastName: Joi.string().min(2).max(50),
        firstName: Joi.string().min(2).max(50)
    }),
    book: Joi.object().keys({
        title: Joi.string().min(1).max(300),
        synopsis: Joi.string().max(1000),
        isbn10: Joi.number().integer().greater(1000000000),
        isbn13: Joi.number().integer().greater(1000000000000),
        author: Joi.number().integer().positive().max(10000000)
    }),
    id: Joi.number().integer().positive().required().max(10000000),
    page: Joi.number().integer().positive().required().max(100000).default(1),
    perPage: Joi.number().integer().positive().required().max(100).default(10),
    find: Joi.string().empty('').max(100),
    order: Joi.string().insensitive().required().valid('asc', 'desc').default('asc'),
    authorSort: Joi.string().insensitive().required().valid('penName', 'lastName', 'firstName').default('penName'),
    bookSort: Joi.string().insensitive().required().valid('title', 'isbn10', 'isbn13', 'author').default('title')
};
