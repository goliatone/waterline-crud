'use strict';

const extend = require('gextend');
const helper = require('../utils');
const errorFormatter = require('../errors');


const NOOP = function $noop(o) {
    return Promise.resolve(o);
};

const DEFAULTS = {
    primaryKey: 'id',
    paramName: 'id',
    countAction: 'cunt',
    logger: console,

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

    formatResponse: function(res, record, success) {

        if(success === true) {
            return res.status(200).json({
                success: success,
                value: record
            });
        }

        let error = errorFormatter(record);
        res.status(error.status).json(error);
    },
    actionMap: {
        //POST /resource
        'new': 'create',
        'create': 'create',

        //GET /resource
        'index': 'read',
        'read': 'read',

        //PUT /resource
        'update': 'update',

        //DELETE /resource/:id
        'destroy': 'delete',
        'delete': 'delete',

        //GET /resource/count
        'count': 'count',

        //GET /resource/:id
        'show': 'readById',
        'readById': 'readById',
    }
};

class ApiController {

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

    handle(action) {
        //TODO: We want to have a map so we can
        //ignore case in action and have aliases.
        action = this.getActionAlias(action);

        return this[action].bind(this);
    }

    setResource(resource) {
        this.resource = resource;

        if(!resource.lifecycle) {
            return;
        }

        extend(this, resource.lifecycle);
    }

    formatResponse(res, result, ok) {
        throw new Error('Need to implement formatResponse');
    }

    getPopulateRelationships() {
        return helper.getRelationShipsByAlias(this.resource.attributes);
    }

    create(req, res, next) {

        let self = this;

        //@TODO: store req, res, and next.
        //bind to beforeSave et all, we only
        //need to take one argument, which comes
        //from the function.
        return Promise.resolve({})
            .then(function beforeSave(body) {
                return self.beforeSave(body, req);
            })
            .then(function beforeCreate(body){
                return self.beforeCreate(body, req);
            })
            .then(function createHandler(body){
                return self.createHandler(req, res);
            })
            .then(function afterSave(result){
                return self.afterSave(result);
            })
            .then(function afterCreate(result) {
                return self.afterCreate(result);
            })
            .then(function formatResponse(record) {
                self.formatResponse(res, record, true);
            })
            .catch(function errorHandler(err) {
                self.logger.error('POST handler error');
                self.logger.error(err.message);
                self.formatResponse(res, err, false);
            });
    }

    createHandler(req, res) {
        let resource = this.resource;

        let model = helper.getModel(req.body, resource);

        /*
         * Find all realtionships this model has to
         * populate results.
         */
        let relationships = this.getPopulateRelationships();

        return this.resource.create(model).then(function onCreated(result) {
            /*
             * Always return an array
             */
            if(!Array.isArray(result)) {
                result = [result];
            }

            let promises = result.map(function populate(record) {
                return resource.findOne(record.id)
                    .populate(relationships)
                    .then(function returnRecord(record) {
                        return record;
                    });
            });

            return Promise.all(promises);
        });
    }

    /**
     * Get a list of resources using id or query stringify
     *
     * lifecycle:
     * - beforeAccess
     * - afterAccess
     *
     * @method read
     * @param  {Object}   req  Reqeust instance
     * @param  {Object}   res  Response instance
     * @param  {Function} next Next handler
     * @return {Promise}
     */
    read(req, res, next) {
        let self = this;

        return Promise.resolve({})
            .then(function beforeAccess(body){
                return self.beforeAccess(body, req);
            })
            .then(function readHandler(){
                return self.readHandler(req, res);
            })
            .then(function afterAccess(result) {
                return self.afterAccess(result);
            })
            .then(function formatResponse(result) {
                return self.formatResponse(res, result, true);
            })
            .catch(function errorHandler(err) {
                self.logger.error('GET handler error');
                self.logger.error(err.message);
                self.logger.error(err.stack);
                return self.formatResponse(res, err.message, false);
            });
    }

    readHandler(req, res) {
        let self = this;
        let resource = this.resource;

        /*
         * get all related models, cose we are going
         * to populate them
         */
        let relationships = this.getPopulateRelationships();

        let query = {};

        //@TODO: We need to support order, limit, etc
        //https://github.com/goliatone/menagerie/blob/master/lib/BaseController.js#L219
        /*
         * first, we look for a primaryKey
         * in the request. This would be the
         * case for GET /resource/:id
         *          GET /resource?primaryKey=X
         */
        let pk = helper.consumeParam(req, this.primaryKey, false);

        query[this.primaryKey] = pk;

        if(!pk) {
            /*
             * This might be a generic search.
             * Just pull a query string from
             * request.
             */
            query = helper.parseQuery(req, resource);
            console.log('------- query --------');
            console.log(req.body);
            console.log('');
            console.log(req.query);
            console.log('');
            console.log(query);
        }
        console.log('resource.find(%j)', query);
        console.log('populate ', relationships);
        console.log('identity ', resource.identity);

        return resource.find(query)
            .populate(relationships)
            .then(function returnRecord(result) {
                return result;
            }).catch((err)=>{
                console.log(err);
                return err;
            });
    }

    update(req, res, next) {
        let self = this;

        return Promise.resolve({})
            .then(function beforeSave(body) {
                return self.beforeSave(body, req);
            })
            .then(function beforeUpdate(body) {
                return self.beforeUpdate(body, req);
            })

            .then(function updateHandler(){
                return self.updateHandler(req, res, next);
            })

            .then(self.afterSave.bind(self))
            .then(self.afterUpdate.bind(self))

            .then(function formatResponse(result){
                return self.formatResponse(res, result, true);
            })
            .catch(function errorHandler(err){
                self.logger.error('PUT handler error');
                self.logger.error(err.message);
                return self.formatResponse(res, err.message, false);
            });
    }

    updateHandler(req, res, next) {
        let resource = this.resource;
        let id = helper.param(req, this.paramName);
        let query = req.query;
        let model = helper.getModel(req.body, resource);

        let relationships = this.getPopulateRelationships();

        return resource.update(id, model)
            .then(function returnRecord(result){
                if(!result || result.length === 0) {
                    throw new Error('Update failed');
                }
                result = result[0];

                return resource.findOne(result.id)
                    .populate(relationships)
                    .then(function returnRecord(record){
                        return record;
                    });
            });
    }

    delete(req, res, next) {
        let self = this;

        return Promise.resolve({})
            .then(function beforeDelete(body){
                return self.beforeDelete(body, req);
            })
            .then(function deleteHandler(){
                return self.deleteHandler(req, res, next);
            })
            .then(function formatResponse(result){
                return self.formatResponse(res, result, true);
            })
            .catch(function errorHandler(err){
                self.logger.error('DELETE handler error');
                self.logger.error(err.message);
                return self.formatResponse(res, err.message, false);
            });
    }

    deleteHandler(req, res, next) {
        let resource = this.resource;
        let query = req.query;
        let ids = helper.param(req, this.paramName, '').split(', ');

        return resource.destroy(ids, query)
            .then(function returnRecord(result) {
                return result;
        });
    }

    count(req, res, next) {
        let self = this;

        return Promise.resolve({})
            .then(function countHanlder(){
                return self.countHanlder(req, res, next);
            })
            .then(function formatResponse(result){
                return self.formatResponse(res, result, true);
            })
            .catch(function errorHandler(err){
                self.logger.error('COUNT handler error');
                self.logger.error(err.message);
                return self.formatResponse(res, err.message, false);
            });
    }

    countHanlder(req, res, next) {
        let resource = this.resource;
        let query = helper.parseQuery(req);

        return resource.count(query)
            .then(function returnRecord(result) {
                return {
                    count: result,
                    query: query
                };
            });
    }

    readById(req, res, next) {
        let self = this;
        let resource = this.resource;
        return Promise.resolve({})
            .then(function beforeAccess(body, req) {
                return self.beforeAccess(body, req);
            })
            .then(function getByIdHandler(){
                return self.readByIdHandler(req, res);
            })
            .then(function afterAccess(result) {
                return self.afterAccess(result);
            })
            .then(function formatResponse(result){
                return self.formatResponse(res, result, true);
            })
            .catch(function errorHandler(err){
                self.logger.error('GET /:id handle error');
                self.logger.error(err.message);
            });
    }

    readByIdHandler(req, res) {
        let query = req.query;
        let resource = this.resource;

        let ids = helper.param(req, this.paramName, '').split(',');

        let relationships = this.getPopulateRelationships();
let self = this;
self.logger.info('We got relationships', relationships);
        return resource.findById(ids, query)
            .populate(relationships)
            .then(function returnRecord(result) {
                result.reslationships = relationships;
                self.logger.info('We got result', result);
                return result;
            });
    }
}

module.exports = ApiController;
