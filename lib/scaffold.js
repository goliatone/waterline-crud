'use strict';

const UrlManager = require('./urlhelper');
const extend = require('gextend');
const helper = require('./utils');

//TODO: move out of here, pass in express as dep? otherwise we are
//tying this to a version!!!
const express = require('express');

const DEFAULTS = {
    logger: console,
    buildRouter: function() {
        return express.Router();
    },
    /**
     * Options object for UrlManager.
     * It's used to set api prefix and
     * crud prefix in the routes.
     * TODO: We should not have this here
     * since it should be agnostic of api/crud.
     *
     * @type {Object}
     */
    urlOptions: {
        apiPrefix: 'api',
        crudPrefix: 'admin'
    }
};

class Scaffold {

    constructor(config) {
        config = extend({}, DEFAULTS, config);
        this.init(config);
    }

    init(config={}) {
        extend(this, config);
    }

    /**
     * Returns a Controller builder for a
     * given type, currenlty there are two
     * types supported:
     * - api
     * - crud
     *
     * @param  {String} type Controller type
     * @return {Controller}      Controller
     */
    getController(type) {
        let controller = this[type].controller;
        if(!controller) throw new Error('Unkown controller type');
        return controller;
    }

    /**
     * Returns an array with the values of `obj`.
     *
     * @param  {Object} [obj={}]
     * @return {Array}
     */
    getValuesFromObject(obj={}) {
        return Object.keys(obj).map((key)=>obj[key]);
    }

    getRouter(router) {
        if(router) return router;

        if(this.router === true) return this.buildRouter();
        //TODO: Do we want to return app? ^^
        return this.router ? this.router : this.buildRouter();
    }

    getMiddleware(middleware, endpointType) {
        let defaults = this[endpointType].middleware;

        if(!Array.isArray(defaults)) {
            defaults = this.getValuesFromObject(defaults);
        }

        if(!middleware) middleware = [];

        middleware = defaults.concat(middleware);
        middleware = middleware.filter(helper.byMiddleware);
        middleware = middleware.concat(defaults);

        return middleware;
    }

    addRoute(action, controller, middleware) {
        let resource = this.resource;

        let router = this.getRouter();

        let route = this.urlManager.toRouteObject(action);
        this.logger.info('Add rote: "%s"', route.route);
        router[route.method](route.route, middleware, controller.handle(action));

        let type = route.prefix.indexOf('api') !== -1 ? 'api' : 'crud';

        this.emitter.emit('scaffold.route.add', {
            type: type,
            route: route.route,
            method: route.method,
            action: action,
            resource: resource,
        });
    }


    /**
     * Setup routes and handlers for HTML facing resources.
     *
     * By default:
     * GET /<resource> ->           list (index)
     * GET /<resource>/:id ->       show
     * GET /<resource>/:id/edit ->  edit
     * GET /<resource>/create ->    new
     *
     * @method setupCrudRoutes
     * @param  {Object}        router          Express router
     * @param  {Object}        resource        Model definition
     * @param  {Object}        o               Options Object
     * @param  {Array}         middleware=[]   Array of middleware
     *                                         to be applied.
     * @return {void}
     */
    setupCrudRoutes (router, middleware=[]) {
        this.router = router;

        let resource = this.resource;

        middleware = this.getMiddleware(middleware, 'crud');

        // this.logger.warn('CRUD view middlware not implemented!!!');
        // this.logger.info('We are ignoring this for now...');
        // //TODO: Make for realz...
        // middleware = [];

        const Controller = this.getController('crud');
        let options = this.crud.options;

        let controller = new Controller(options);
        controller.setResource(resource);

        console.log('------- ++++++++++ ---------');
        console.log('Router mountpath', router.mountpath);
        console.log('------- ++++++++++ ---------');
        /*
         * If we are generating CRUD routes for an
         * express subapp then we have to take into
         * account the mountpath.
         */
        let crudUrlManager = UrlManager.getDefault(this.resource, {
            crudPrefix: 'admin',
            apiPrefix: 'api'
        });

        controller.setUrlManager(crudUrlManager);

        //GET /admin/user
        this.addRoute('list', controller, middleware);

        //GET /admin/user/create
        this.addRoute('create', controller, middleware);

        //GET /admin/user/:id/edit
        this.addRoute('edit', controller, middleware);

        //GET /admin/user/:id
        this.addRoute('view', controller, middleware);
    }

    /**
     * Create an ApiController for a given resource.
     *
     * @method setApiRoutes
     * @param  {Object}     router          Express router
     *                                      or application
     * @param  {Array}      [middleware=[]] Middleware array
     */
    setApiRoutes (router, middleware=[]) {
        this.router = router;

        middleware = this.getMiddleware(middleware, 'api');

        let resource = this.resource;

        const Controller = this.getController('api');
        let options = this.api.options;
        let controller = new Controller(options);
        controller.setResource(resource);

        //POST    /api/<resource>
        this.addRoute('new', controller, middleware);

        //GET     /api/<resource>
        this.addRoute('index', controller, middleware);

        //PUT     /api/<resource>/:id
        this.addRoute('update', controller, middleware);

        //DELETE  /api/<resource>/:id
        this.addRoute('destroy', controller, middleware);

        //GET     /api/<resource>/count
        this.addRoute('count', controller, middleware);

        //GET     /api/<resource>/:id
        this.addRoute('show', controller, middleware);
    }

    /**
     * Generate api endpoint for a given resource.
     * @method api
     * @param  {String} route      Route path
     * @param  {Array} middleware  List of middleware
     * @param  {Object} resource   Model
     * @return {void}
     */
    api(route, middleware, resource) {

    }

    crud(route, middleware, resource) {

    }

    set resource(v) {
        if(v) {
            this.urlManager = UrlManager.getDefault(v, this.urlOptions);
        }
        this._resource = v;
    }

    get resource(){
        return this._resource;
    }
}

Scaffold.DEFAULTS = DEFAULTS;

module.exports = Scaffold;

module.exports.DEFAULTS = DEFAULTS;

module.exports.Scaffold = Scaffold;
