'use strict';

const Schemas = require('../lib/schemas');

const Code = require('code');
const Lab = require('lab');
const Joi = require('joi');

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

describe('lib/schemas', () => {

    it('exposes a joi schema of a author', (done) => {

        expect(Schemas.author).to.exist();
        expect(Joi.object().schema().validate(Schemas.author).error).to.not.exist();

        return done();
    });

    it('exposes a joi schema of a book', (done) => {

        expect(Schemas.book).to.exist();
        expect(Joi.object().schema().validate(Schemas.book).error).to.not.exist();

        return done();
    });

    it('has id validation', (done) => {

        expect(Schemas.id.validate).to.exist();

        return done();
    });

    it('has perPage validation', (done) => {

        expect(Schemas.perPage.validate).to.exist();

        return done();
    });

    it('has page validation', (done) => {

        expect(Schemas.page.validate).to.exist();

        return done();
    });

    it('has find validation', (done) => {

        expect(Schemas.find.validate).to.exist();

        return done();
    });

    it('has order validation', (done) => {

        expect(Schemas.order.validate).to.exist();

        return done();
    });

    it('has author sort validation', (done) => {

        expect(Schemas.authorSort.validate).to.exist();

        return done();
    });

    it('has book sort validation', (done) => {

        expect(Schemas.bookSort.validate).to.exist();

        return done();
    });
});
