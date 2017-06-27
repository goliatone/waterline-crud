'use strict';

const UrlManager = require('./urlhelper');
const extend = require('gextend');
const helper = require('./utils');

//TODO: move out of here, pass in express as dep? otherwise we are
//tying this to a version!!!
const express = require('express');

const DEFAULTS = {
    logger: console
};

class Scaffold {

    constructor(config) {
        config = extend({}, DEFAULTS, config);
        this.init(config);
    }

    init(config={}) {
        extend(this, config);
    }

    set resource(v) {
        if(v) {
            this.urlManager = UrlManager.getDefault(v);
        }
        this._resource = v;
    }

    get resource(){
        return this._resource;
    }
    getController(type) {
        let controller = this[type].controller;
        if(!controller) throw new Error('Unkown controller type');
        return controller;
    }

    getValuesFromObject(obj={}) {
        return Object.keys(obj).map((key)=>obj[key]);
    }

    getRouter(router) {
        if(this.router === true) return express.Router();
        //TODO: Do we want to return app? ^^
        return this.router ? this.router : express.Router();
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
}
Scaffold.DEFAULTS = DEFAULTS;
module.exports = Scaffold;
module.exports.DEFAULTS = DEFAULTS;
module.exports.Scaffold = Scaffold;