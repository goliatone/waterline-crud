'use strict';

/**
 * Returns the attributes that match to
 * the models. This is to be used on a request
 * handler.
 *
 * @param  {Object} body  Usually a req obj
 * @param  {Object} model Waterline instance
 * @return {Object}       Object with payload
 */
module.exports.getModel = function $getModel(body, model) {
    //We should be able to use Box.attributes to
    //pick only what we need.
    return body;
};

/**
 * Returns an array with the relationships of the model. We can return either
 * the model name of each, or the alias.
 * We need the model name to build queries that load model instances, i.e for
 * HTML <select>s
 * We use the alias name to populate relationships on querying models.
 *
 * @param  {Object} definition          Waterline definition object
 * @param  {String} useModelNameOrAlias model|alias
 * @return {Array}                     Array containing the name of related entities
 */
module.exports.getRelationships = function $getRelationships(definition, modelNameOrAlias) {
    modelNameOrAlias = modelNameOrAlias || 'alias';

    if(!modelNameOrAlias.match(/^alias$|^model$|^collection$/)) modelNameOrAlias = 'alias';

    var property,
        attribute,
        relationships = [];

    Object.keys(definition).map(function(key) {
        attribute = definition[key];

        if(typeof attribute === 'function'){
            return;
        }

        if(modelNameOrAlias === 'alias' && !attribute.hasOwnProperty(modelNameOrAlias)
        && !attribute.collection) {
            return;
        }

        property = modelNameOrAlias;

        /*
         * We want models, this will return
         * "credential":
         *
         * credentials: {
         *   collection: credential,
         *   via: user
         * }
         */
        if(modelNameOrAlias === 'model') {
            if(!attribute[modelNameOrAlias]) property = 'collection';
        }

        /*
         * This case adds "credentials":
         *
         * credentials: {
         *   collection: credential,
         *   via: user
         * }
         */
        if(modelNameOrAlias === 'alias' && attribute.collection) {
            return relationships.push(key);
        }

        if(!attribute[property]) return;

        relationships.push(attribute[property]);
    });

    return relationships;
};

module.exports.getRelationShipsByAlias = function $getRelationShipsByAlias(definition) {
    return module.exports.getRelationships(definition, 'alias');
};

module.exports.getRelationShipsByModel = function $getRelationShipsByModel(definition) {
    return module.exports.getRelationships(definition, 'model');
};

module.exports.getEntityMetadata = function $getEntityMetadata(model) {
    var metadata = model.attributes;

    return metadata;
};


/*
 * Filter arguments by middleware.
 *
 * A valid middleware item is defined as
 * a function with arity 3
 */
module.exports.byMiddleware = function $byMiddleware(item) {
    return typeof item === 'function' && item.length === 3;
};


/*
 * Check if resource has a function of a name
 * but mapped to be able to rename the actual
 * function names.
 *
 * ```
 * hasMethod(resource, 'delete', {delete: 'destroy', udpate: 'update'});
 * ```
 */
module.exports.hasMethod = function $hasMethod(resource, method, methods){
    return typeof resource[methods[method]] === 'function';
};


module.exports.isRouter = function $isRouter(obj){
    return typeof obj.route === 'function' && typeof obj['process_params'] === 'function';
};


module.exports.getViewPath = function $getViewPath(basepath, identity, action){
    if(basepath) return [].join.call(arguments, '/');
    return [identity, action].join('/');
};

/**
 * Get the value of "param" in an express
 * request, "req", if not found, return default
 * value "def".
 *
 * @method param
 * @param  {Object} req  Express Request
 * @param  {String} name Parameter name
 * @param  {Mixed} def  Default value if
 *                      name not found in req.
 * @return {Mixed}
 */
module.exports.param = function $param(req, name, def){
    var body = req.body || {};
    var query = req.query || {};
    var params = req.params || {};

    if (null != params[name] && params.hasOwnProperty(name)) return params[name];
    if (null != body[name]) return body[name];
    if (null != query[name]) return query[name];

    return def;
};

/**
 * Build criteria from a query object.
 * @TODO: This needs to be implemented
 *
 * @type {Object}
 */
module.exports.buildCriteria = function $buildCriteria(query, resource) {

    if(!query) return {};

    if(query.filter){
        query.where = query.filter;
        delete query.filter;
    }

    return query;
};

/**
 * Remove name from request, either in
 * body, query, or params.
 *
 * @method _remove
 * @param  {Object} req  Express Request
 * @param  {String} name
 * @return {void}
 */
module.exports.remove = function _remove(req, name){
    if(req.body[name]) delete req.body[name];
    if(req.query[name]) delete req.query[name];
    if(req.params[name]) delete req.params[name];
};

module.exports.consumeParam = function(req, name, def) {
    let out = module.exports.param(req, name, def);
    module.exports.remove(req, name);
    return out;
};

module.exports.transferParam = function(req,name, property, def, out={}) {
    let value = module.exports.consumeParam(req, name, def);
    out[property] = value;
    return out;
};

/*
 * TODO: We should only take valid filters
 * from body.query, otherwise
 * we return empty results...
 */
module.exports.parseQuery = function(req, resource) {
    let query = req.query || {};

    if(query.where) {
        if(typeof query.where === 'string') {
            try {
                query.where = JSON.parse(query.where);
            } catch(e) {
                req.logger.error('Error parsing stuff');
            }
        }

        // query = query.where;
    }

    return query;
};

/**
 * If we have a request with a GET, HEAD, or DELETE
 * verb we should parse the QS and
 * @param  {[type]} req [description]
 * @return {[type]}     [description]
 */
module.exports.normalizeQueryString = function(req) {
    let body = req.body;
    // let method = getMethod(req);
    // if(body && ['GET', 'HEAD', 'DELETE'].indexOf(method) > 0){
    //  let fileds = QS.stringify(body);
    //  req.url -> append fields to query string
    // }
};

module.exports.emptyRecord = function(Model) {
    return module.exports.setDefaultValuesForRecord(Model, {});
};

module.exports.setDefaultValuesForRecord = function(Model, record={}) {
    let schema = Model.definition;

    let field, definition;
    Object.keys(schema).map((key) => {
        definition = schema[key];
        if(record.hasOwnProperty(key)) return;
        if(!definition.defaultsTo) return;
        record[key] = _get(definition.defaultsTo);
    });

    return record;
};

function _get(defaultsTo) {
    if(typeof defaultsTo === 'function') {
        return defaultsTo();
    }
    return defaultsTo;
}
