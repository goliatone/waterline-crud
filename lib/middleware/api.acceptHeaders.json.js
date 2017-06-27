'use strict';

module.exports = function enforceAcceptsJSON(req, res, next) {
    req.logger.info('Request Accepts header %s', req.headers['accept']);
    req.headers['accept'] = 'application/json';
    next();
};
