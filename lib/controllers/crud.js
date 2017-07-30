'use strict';

const extend = require('gextend');
const helper = require('../utils');

const DEFAULTS = {
    prefix: 'admin',
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
    },
    viewMap: {
        'list': '',
        'create': 'create',
        'view': 'show',
        'show': 'show',
        'edit': 'edit'
    }
};

class CrudController {

    constructor(options, resource=null) {

        options = extend({}, DEFAULTS, options);

        this.options = options;
        this.resource = resource;

        extend(this, options);
    }

    mapAction(alias, action) {
        this.actionMap[alias] = action;
    }

    getActionAlias(action) {
        if(this.actionMap[action]) {
            return this.actionMap[action];
        }
        return action;
    }

    /**
     * Helper method to bind controller
     * action to a route.
     * The main benefit is that we return
     * a function that is binded to this
     * instance.
     *
     * @method handle
     * @param  {String} action Action matching
     *                         a method here.
     * @return {Function}
     */
    handle(action) {
        action = this.getActionAlias(action);

        return this[action].bind(this);
    }

    setResource(resource) {
        this.resource = resource;
    }

    findModelByName(orm, modelName) {
        throw new Error('Implement findModelByName');
    }

    list(req, res, next) {

        let method = 'GET';
        let action = 'list';

        let relationships = helper.getRelationShipsByAlias(this.resource.definition);

        let criteria = helper.buildCriteria(req.query, this.resource);

        /*
         * Query should be of the form:
         * ?where[boxset]=1
         * ?filter[boxset]=1
         */
        return this.resource.find(criteria)
            .populate(relationships).then((results = []) => {

                let payload = {
                    req: req,
                    method: method,
                    crudAction: action,
                    meta: this.resourceMetadata,
                    layout: this.layout,
                    section: this.section,
                    entityName: this.entityName,
                    records: results
                };

                let viewPath = this.getViewPath('list');
                res.render(viewPath, payload);

            }).catch(next);
    }

    create(req, res, next) {
        let method = 'POST';
        let action = 'create';
        // let action = 'new';

        //this.options.route ~= record.identity
        //TODO: We need to be able to set this from outside
        let formAction = this.urlManager.route(action);

        //This should also include collections!!
        let relationships = helper.getRelationShipsByModel(this.resource.attributes);

        let promises = [];
        let resultNames = [];

        let model, i;

        relationships.map((rel) => {
            model = this.options.findModelByName(this.resource.waterline, rel);
            i = promises.push(model.find({})) - 1;

            resultNames.push({
                identity: rel,
                index: i
            });
        });

        if (Object.keys(req.query).length) {
            let criteria = helper.buildCriteria(req.query, this.resource);
            promises.push(this.resource.findOne(criteria));
        }

        //TODO: Probably, create only needs an empty model :)
        return Promise.all(promises).then((results = []) => {

            let payload = {
                req: req,
                method: method,
                crudAction: action,
                action: formAction,
                meta: this.resourceMetadata,
                layout: this.layout,
                section: this.section,
                entityName: this.entityName,
                record: this.makeEmptyRecord()
            };

            if (req.query) {
                payload.record = results.pop() || {};
            }

            resultNames.map((obj) => {
                //TODO: We could use inflexion to go from owner to owners
                //if is a collection
                payload[obj.identity] = results[obj.index];
            });

            let viewPath = this.getViewPath(action);
            res.render(viewPath, payload);
        }).catch(next);
    }

    show(req, res, next) {
        let method = 'PUT';
        // let action = 'show';
        let action = 'view';
        let id = helper.param(req, this.options.paramName);

        /*
         * We want to PUT to the same
         * URL we are showing from.
         */
        let formAction = this.urlManager.route(action);
        formAction = formAction.replace(':id', id);

        //This should also include collections!!
        let relationships = helper.getRelationShipsByModel(this.resource.attributes);

        let promises = [];
        let resultNames = [];

        let model, i;

        relationships.map((rel) => {
            model = this.options.findModelByName(this.resource.waterline, rel);
            i = promises.push(model.find({})) - 1;

            resultNames.push({
                identity: rel,
                index: i
            });
        });

        promises.push(this.resource.findOne(id));

        return Promise.all(promises).then((results = []) => {

            let payload = {
                req: req,
                method: method,
                crudAction: action,
                action: formAction,
                meta: this.resourceMetadata,
                layout: this.layout,
                section: this.section,
                entityName: this.entityName,
                record: {}
            };

            if (id || req.query) {
                payload.record = results.pop() || {};
            }

            resultNames.map((obj) => {
                //TODO: We could use inflexion to go from owner to owners
                //if is a collection
                payload[obj.identity] = results[obj.index];
            });

            let viewPath = this.getViewPath(action);
            res.render(viewPath, payload);
        }).catch(next);
    }

    edit(req, res, next) {
        let action = 'edit';
        let method = 'PUT';
        let id = helper.param(req, this.options.paramName);

        /*
         * We want to PUT to the same
         * URL we are showing from.
         */
        let formAction = this.urlManager.route(action);
        formAction = formAction.replace(':id', id);

        //This should also include collections!!
        let relationships = helper.getRelationShipsByModel(this.resource.attributes);

        let promises = [];
        let resultNames = [];

        let model, i;

        relationships.map((rel) => {
            model = this.options.findModelByName(this.resource.waterline, rel);
            i = promises.push(model.find({})) - 1;

            resultNames.push({
                identity: rel,
                index: i
            });
        });

        promises.push(this.resource.findOne(id));

        return Promise.all(promises).then((results) => {
            var payload = {
                req: req,
                method: method,
                crudAction: action,
                action: formAction,
                meta: this.resourceMetadata,
                layout: this.layout,
                section: this.section,
                entityName: this.entityName,
                record: {}
            };

            if (id) {
                payload.record = results.pop() || {};
            }

            resultNames.map((obj) => {
                //TODO: We could use inflexion to go from owner to owners
                //if is a collection
                payload[obj.identity] = results[obj.index];
            });

            //admin/box/edit|new
            let viewPath = this.getViewPath(action);
            res.render(viewPath, payload);

        }).catch(next);
    }

    getViewPath(view) {
        return helper.getViewPath(this.options.views.basepath, this.resource.identity, view);
    }

    makeEmptyRecord() {
        return helper.emptyRecord(this.resource);
    }

    setUrlManager(manager) {
        this.urlManager = manager;
    }

    get resourceMetadata() {
        return helper.getEntityMetadata(this.resource);
    }

    get layout() {
        return this.options.views.layout;
    }

    get section() {
        return this.resource.identity;
    }

    get entityName() {
        return this.resource.identity;
    }
}


module.exports = CrudController;
