'use strict';

const extend = require('gextend');

const DEFAULTS = {
    prefix: '',
    resource: {},
    param: ':id',
    crud: {
        templates: {
            // we could use templates like:
            // list: function(o) {
            //     with(this) {
            //         return `/${prefix}/${resource}`;
            //     }
            // }
            // And then we call list.call(this) or
            // list.call({})
            list: function(o) {
                return `/${o.prefix}/${o.resource}`;
            },
            create: function(o) {
                return `/${o.prefix}/${o.resource}/${o.action}`;
            },
            view: function(o) {
                return `/${o.prefix}/${o.resource}/${o.id}`;
            },
            edit: function(o) {
                return `/${o.prefix}/${o.resource}/${o.id}/${o.action}`;
            }
        }
    },
    api: {
        templates: {
            index: function(o) {
                return `/${o.prefix}/${o.resource}`;
            },
            show: function(o) {
                return `/${o.prefix}/${o.resource}/${o.id}`;
            },
            new: function(o) {
                return `/${o.prefix}/${o.resource}`;
            },
            count: function(o) {
                return `/${o.prefix}/${o.resource}/${o.action}`;
            },
            update: function(o) {
                return `/${o.prefix}/${o.resource}/${o.id}`;
            },
            destroy: function(o) {
                return `/${o.prefix}/${o.resource}/${o.id}`;
            },
            delete: function(o) {
                return `/${o.prefix}/${o.resource}/${o.id}`;
            }
        },
        /*
         * If we don't specify a methods object
         * mapping an action to an HTTP method
         * then we will use `GET` by default.
         */
        methods: {
            show:    'GET',
            index:   'GET',
            count:   'GET',
            new:     'POST',
            update:  'PUT',
            destroy: 'DELETE',
            delete: 'DELETE',
        }
    }
};

/**
 * UrlManager is a helper utility class to build
 * URLs based on a resource.
 *
 * @TODO Make fromURL('http://me.io/api/user/3')
 */
class UrlManager {

    constructor(config) {

        this.methods = {};
        this.actions = {};

        config = extend({}, DEFAULTS, config);

        this.init(config);
    }

    init(config={}) {
        extend(this, config);
    }

    addTemplates(prefix, templates = {}) {
        if(typeof prefix === 'object') {
            templates = prefix;
            prefix = '';
        }

        this.templates = templates;

        Object.keys(templates).map((key) => {

            this.actions[key] = this.restfulEndpoinBuilder({
                resource: this.resource,
                id: this.id,
                action: key,
                prefix: prefix,
                template: templates[key]
            });

            this[key] = this.actions[key];
        });
    }

    addMethods(action, method) {
        if (typeof action === 'object') {
            Object.keys(action).map((key) => {
                this.addMethods(key, action[key]);
            });
        }
        this.methods[action] = method;
    }

    method(action) {
        if (!this.methods[action]) return 'GET';
        return this.methods[action];
    }

    endpoint(action, options = {}) {
        options = this.getOptions(options);
        options.action = action;
        return this.actions[action](options);
    }

    route(action) {
        return this.endpoint(action, {
            id: this.param
        });
    }

    fullRoute(action) {
        return this.method(action) + ' ' + this.route(action);
    }

    getOptions(options) {
        let out = {
            resource: this.resource,
            id: this.id,
            action: this.action
        };

        return extend({}, out, options);
    }

    toRouteObject(actionId, prefix='') {
        let action = this.actions[actionId];

        if(!action) {
            /*
             * How do we handle this case? Should we
             * throw an error?
             */
            return {};
        }

        let o = action.config;

        return {
            route: this.route(actionId),
            action: actionId,
            method: this.method(actionId).toLowerCase(),
            prefix: prefix || o.prefix || ''
        };
    }

    restfulEndpoinBuilder(config) {
        let self = this;

        function template(options = {}) {
            let o = extend({}, self.getOptions(config), options);
            let url = config.template(o);
            url = url.replace(/\/\//, '');
            url = url.replace(/\/$/, '');
            if (url.charAt(0) !== '/') url = '/' + url;
            return url;
        }

        template.config = config;

        return template;
    }
}

UrlManager.DEFAULTS = DEFAULTS;

module.exports.UrlManager = UrlManager;

/**
 * Build a default UrlManager passing a resource.
 * We can pass in an options object which by default
 * has the following values:
 * - apiPrefix: api
 * - crudPrefix: admin
 *
 * Prefixes, by default, get
 * @param  {String|Object} resource
 * @param  {Object} [options={}]
 * @return {UrlManager}
 */
module.exports.getDefault = function(resource, o = {
    apiPrefix: 'api',
    crudPrefix: ''
}){

    let options = {};

    if(typeof resource === 'object') {
        options.id = resource.id;
        options.resource = resource.identity;
    } else options.resource = resource;

    let manager = new UrlManager(options);

    /*
     * Create crud endpoints under admin:
     */
    manager.addTemplates(o.crudPrefix, DEFAULTS.crud.templates);

    manager.addTemplates(o.apiPrefix, DEFAULTS.api.templates);
    manager.addMethods(DEFAULTS.api.methods);

    return manager;
};
