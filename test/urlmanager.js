'use strict';

const test = require('tape');
const sinon = require('sinon');

const urlHelper = require('../lib/urlhelper');

test('UrlManager should expose DEFAULTS', (t) => {
    t.ok(urlHelper.UrlManager.DEFAULTS);
    t.end();
});


test('UrlManager should expose a getDefault static method', (t) => {
    t.ok(urlHelper.getDefault);
    t.end();
});

test('getDefault should configure a valid manager', (t) => {
    let manager = urlHelper.getDefault({
        id: 1,
        identity: 'user'
    });

    t.ok(manager instanceof urlHelper.UrlManager);
    t.end();
});

test('CRUD list: GET /user/list', (t) => {
    let manager = urlHelper.getDefault({
        id: 1,
        identity: 'user'
    });

    let expected = {
        route: '/user',
        action: 'list',
        method: 'get',
        prefix: ''
    };

    let route = manager.toRouteObject('list');

    t.deepEqual(route, expected, 'CRUD list should return a valid');
    t.end();
});

test('CRUD view: GET /user/:id', (t) => {
    let manager = urlHelper.getDefault({
        id: 1,
        identity: 'user'
    });

    let expected = {
        route: '/user/:id',
        action: 'view',
        method: 'get',
        prefix: ''
    };

    let route = manager.toRouteObject('view');

    t.deepEqual(route, expected, 'CRUD view should return a valid');
    t.end();
});

test('CRUD create: GET /user/create', (t) => {
    let manager = urlHelper.getDefault({
        id: 1,
        identity: 'user'
    });

    let expected = {
        route: '/user/create',
        action: 'create',
        method: 'get',
        prefix: ''
    };

    let route = manager.toRouteObject('create');

    t.deepEqual(route, expected, 'CRUD create should return a valid');
    t.end();
});

test('CRUD edit: GET /user/:id/edit', (t) => {
    let manager = urlHelper.getDefault({
        id: 1,
        identity: 'user'
    });

    let expected = {
        route: '/user/:id/edit',
        action: 'edit',
        method: 'get',
        prefix: ''
    };

    let route = manager.toRouteObject('edit');

    t.deepEqual(route, expected, 'CRUD edit should return a valid');
    t.end();
});

test('API new: POST /api/user', (t) => {
    let manager = urlHelper.getDefault({
        id: 1,
        identity: 'user'
    });

    let expected = {
        route: '/api/user',
        action: 'new',
        method: 'post',
        prefix: 'api'
    };

    let route = manager.toRouteObject('new');

    t.deepEqual(route, expected, 'API new should return a valid');
    t.end();
});

test('API show: GET /api/user/:id', (t) => {
    let manager = urlHelper.getDefault({
        id: 1,
        identity: 'user'
    });

    let expected = {
        route: '/api/user/:id',
        action: 'show',
        method: 'get',
        prefix: 'api'
    };

    let route = manager.toRouteObject('show');

    t.deepEqual(route, expected, 'API show should return a valid');
    t.end();
});

test('API count: GET /api/user/count', (t) => {
    let manager = urlHelper.getDefault({
        id: 1,
        identity: 'user'
    });

    let expected = {
        route: '/api/user/count',
        action: 'count',
        method: 'get',
        prefix: 'api'
    };

    let route = manager.toRouteObject('count');

    t.deepEqual(route, expected, 'API count should return a valid');
    t.end();
});

test('API update: PUT /api/user/:id', (t) => {
    let manager = urlHelper.getDefault({
        id: 1,
        identity: 'user'
    });

    let expected = {
        route: '/api/user/:id',
        action: 'update',
        method: 'put',
        prefix: 'api'
    };

    let route = manager.toRouteObject('update');

    t.deepEqual(route, expected, 'API update should return a valid');
    t.end();
});

test('API destroy: DELETE /api/user/:id', (t) => {
    let manager = urlHelper.getDefault({
        id: 1,
        identity: 'user'
    });

    let expected = {
        route: '/api/user/:id',
        action: 'destroy',
        method: 'delete',
        prefix: 'api'
    };

    let route = manager.toRouteObject('destroy');

    t.deepEqual(route, expected, 'API delete should return a valid');
    t.end();
});

test('API delete: DELETE /api/user/:id', (t) => {
    let manager = urlHelper.getDefault({
        id: 1,
        identity: 'user'
    });

    let expected = {
        route: '/api/user/:id',
        action: 'delete',
        method: 'delete',
        prefix: 'api'
    };

    let route = manager.toRouteObject('delete');
    t.comment('Action destroy and delet are the same.');
    t.deepEqual(route, expected, 'API delete should return a valid');
    t.end();
});

test('API prefix: DELETE /api/v0/user/:id', (t) => {
    let manager = urlHelper.getDefault({
        id: 1,
        identity: 'user'
    }, {
        apiPrefix: 'api/v0'
    });

    let expected = {
        route: '/api/v0/user/:id',
        action: 'delete',
        method: 'delete',
        prefix: 'api/v0'
    };

    let route = manager.toRouteObject('delete');
    t.comment('Action destroy and delet are the same.');
    t.deepEqual(route, expected, 'getDefault should accept apiPrefix option');
    t.end();
});

test('CRUD prefix: GET /admin/create', (t) => {
    let manager = urlHelper.getDefault({
        id: 1,
        identity: 'user'
    }, {
        crudPrefix: 'admin'
    });

    let expected = {
        route: '/admin/user/create',
        action: 'create',
        method: 'get',
        prefix: 'admin'
    };

    let route = manager.toRouteObject('create');

    t.deepEqual(route, expected, 'getDefault should accept crudPrefix option');
    t.end();
});
