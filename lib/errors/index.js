'use strict';

const extend = require('gextend');
const forbidden = require('./forbidden');
const unknown = require('./unknown');
const validation = require('./validation');

const DEFAULTS = {
    forbidden,
    unknown,
    validation
};

module.exports = function(error, options = {}) {
    if (!error) return options.unknown(error, options);

    options = extend({}, DEFAULTS, options);

    error = error.toJSON ? error.toJSON() : error;

    switch (error.error) {
        case 'E_VALIDATION':
            return options.validation(error, options);
        case 'E_UNKNOWN':
            return options.unknown(error, options);
        case 'E_FORBIDDEN':
            return options.unknown(error, options);
        default:
            return options.unknown(error, options);
    }
};
