'use strict';

const Server = require('../lib/server');

const Code = require('code');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

describe('lib/index', () => {

    it('returns a server object', (done) => {

        expect(Server.hasOwnProperty('start')).to.exist();

        Server.initialize((err) => {

            expect(err).to.not.exist();

            return done();
        });
    });
});
