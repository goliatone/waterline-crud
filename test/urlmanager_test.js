'use strict';

const test = require('tape');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

test('Application should be up', (t)=>{
    t.ok('true');
    t.end();
});
