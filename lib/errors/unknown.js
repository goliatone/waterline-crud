'use strict';

module.exports = function(message) {
    let error = {
        code: 'err_unknown',
        status: 500,
        message: 'unknown error',
    };

    if(typeof message === 'string') {
        error.summary = message;
    }

    return error;
};
