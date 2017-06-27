'use strict';

const extend = require('gextend');

const DEFAULTS = {
    processAttribute: _processAttribute
};

module.exports = function(error, options) {
    options = extend({}, DEFAULTS, options);

    // let reports = [];
    //
    // for( let attr in error.invalidAttributes) {
    //     const key = _isFunction(options.key) ? options.key(attr) : attr;
    //     const value = error.invalidAttributes[attr];
    //
    //     reports.push(options.processAttribute(value));
    // }

    /*
     * The 422 (Unprocessable Entity) status code means
     * the server understands the content type of the r
     * equest entity (hence a 415 (Unsupported Media Type)
     * status code is inappropriate), and the syntax of the
     * request entity is correct (thus a 400 (Bad Request)
     * status code is inappropriate) but was unable to process
     * the contained instructions. For example, this error
     * condition may occur if an XML request body contains
     * well-formed (i.e., syntactically correct), but semantically
     * erroneous, XML instructions.
     *
     * More:
     * http://blog.ploeh.dk/2013/04/30/rest-lesson-learned-avoid-204-responses/
     */
    return {
        code: 'err_validation',
        status: 422,
        message: 'validation failed',
        summary: error.summary,
        invalidAttributes: error.invalidAttributes
        // invalidAttributes: reports
    };
};

function _isFunction(fn) {
    return typeof fn === 'function';
}

function _processAttribute(values) {
    return values;
}
