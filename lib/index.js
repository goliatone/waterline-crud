'use strict';

const extend = require('gextend');
const Scaffold = require('./scaffold');

const errorFormatter = require('./errors');

const NOOP = function(o){
    return Promise.resolve(o);
};

const DEFAULTS = {
    logger: console,
    api: {
        /*
         * Implementation for the API
         * actions.
         */
        controller: require('./controllers/api'),
        //We use an object because its easier to merge
        middleware:  {
            /*
             * Default middleware we want to run on
             * each API call.
             * - force accepts to be json type.
             */
            acceptHeaders: require('./middleware/api.acceptHeaders.json')
        },
        options: {
            /*
             * What is the param in our routes for the
             * primaryKey? /:id by default.
             */
            param: '/:id',

            /*
             * Parameter name for the primaryKey
             */
            paramName: 'id',

            paramRegx: /\/:([^\/]+)S/,

            /*
             * this will be added to the count
             * route for a resource.
             * GET /<resouce>/count
             */
            countAction: 'count',
            formatResponse: function(res, record, success) {

                if(success === true) {
                    return res.status(200).json({
                        success: success,
                        value: record
                    });
                }

                let error = errorFormatter(record);
                console.log('Error formatter:', error);
                res.status(error.status).json(error);
            }
        }
    },
    crud: {
        /*
         * Implementation for the views to handle
         * actions.
         *
         * - GET -> LIST
         * - GET/:id -> FORM
         */
        controller: require('./controllers/crud'),
        /*
         * Default middleware we want to run on
         * each CRUD call.
         * - force accepts to be html type.
         */
        middleware: {
            // csrf: require('./middleware/crud.csrf')
            acceptHeaders: require('./middleware/crud.acceptHeaders.html')
        },
        options: {
            paramName: 'id',

            findModelByName: function(orm, modelName) {
                return orm.collections[modelName] || {find: function(){console.error('We did not find resource')}};
            },
            views: {
                basepath: '',
                layout: 'layout'
            },
            actionMap: {
                //GET /resource
                'list': 'list',

                //GET /resource/create
                'create': 'create',

                //GET /resource/:id
                'view': 'show',
                'show': 'show',

                //GET /resource/edit
                'edit': 'edit',
            }
        }
    },
    /*
     * Create default lifecycle
     * for resources that do not
     * implment any of the methods.
     */
    lifecycle: {
        beforeUpdate: NOOP,
        afterUpdate: NOOP,

        beforeCreate: NOOP,
        afterCreate: NOOP,

        beforeAccess: NOOP,
        afterAccess: NOOP,

        beforeDelete: NOOP,
        afterDelete: NOOP,

        beforeSave: NOOP,
        afterSave: NOOP,
    }
};

/*
 * TODO: We should be able to pass middleware for the views
 * so that they are secured using the same system as the other
 * views...
 *
 * TODO: we might want to be able to add namespaces to the
 * CRUD generator, so that we can have different route base
 * app.v1.crud('user', authMiddleware, User);
 * this should create /api/v1/user
 *
 * TODO: We should only take valid filters from body.query, otherwise
 * we return empty results...
 *
 * TODO: Integrate some sort of rate-limit?
 *       https://www.npmjs.com/package/express-rate-limit
 */
module.exports = function(app, settings={}) {
    let _settings = extend({}, DEFAULTS, settings);

    //We have an Scaffold Generator:
    //-> crud: we generate endpoints for views
    //-> api: We generate api endpoint per resoure.

    app.crud = function(route, middleware, resource) {

        let options = extend({}, _settings);
        options.emitter = app;
        options.logger = settings.logger;

        //Adding lifecycle methods to resource
        resource.lifecycle = extend({}, options.lifecycle, resource.lifecycle);
        // console.log('---- CRUD --- ');
        // console.log('options', options);

        let scaffold = new Scaffold(options);

        let router = scaffold.getRouter();

        if(!(resource instanceof Object)) throw new Error('Resource expected to be an object, got ' + typeof resource);
        scaffold.resource = resource;

        /////////////////////////////////////////////////////////
        /// View endpoints
        ///
        /// TODO: We need to provide middleware for both
        /// API and CRUD routes OR we need to divide this in
        /// two function calls:
        /// app.crud() -> CRUD views
        /// app.api()  -> REST interface
        /////////////////////////////////////////////////////////
        scaffold.setupCrudRoutes(router, middleware);

        return router;
    };

    app.api = function(route, middleware, resource, router) {

        let options = extend({}, _settings);
        options.emitter = app;
        options.logger = settings.logger;

        //Adding lifecycle methods to resource
        resource.lifecycle = extend({}, options.lifecycle, resource.lifecycle);

        let scaffold = new Scaffold(options);

        router = scaffold.getRouter(router);

        if(!(resource instanceof Object)) throw new Error('Resource expected to be an object, got ' + typeof resource);
        scaffold.resource = resource;

        scaffold.setupApiRoutes(router, middleware);

        return router;
    };
};

function joinSegments(a, b) {
    return ['/', a.replace(/\//g, ''), '/', b.replace(/\//g, '')].join('');
}
