'use strict';

const extend = require('gextend');

const DEFAULTS = {
    resource: {},
    prefix: '',
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
            }
        },
        methods: {
            show:    'GET',
            index:   'GET',
            count:   'GET',
            new:     'POST',
            update:  'PUT',
            destroy: 'DELETE'
        }
    }
};
//@TODO Make fromURL('http://me.io/api/user/3')
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

    toRouteObject(action) {
        let o = this.actions[action].config;
        return {
            route: this.route(action),
            action: action,
            method: this.method(action).toLowerCase(),
            prefix: o.prefix || ''
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

module.exports.getDefault = function(resource) {

    var options = {
        resource: resource
    };

    if(typeof resource === 'object') {
        options.id = resource.id;
        options.resource = resource.identity;
    }

    let manager = new UrlManager(options);

    //We are creating the admin routes without the
    //prefix
    manager.addTemplates(DEFAULTS.crud.templates);

    manager.addTemplates('api', DEFAULTS.api.templates);
    manager.addMethods(DEFAULTS.api.methods);

    return manager;
};
