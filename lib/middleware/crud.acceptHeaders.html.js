'use strict';

module.exports = function enforceAcceptsHTML(req, res, next) {
    req.logger.info('Request Accepts header %s', req.headers['accept']);
    req.headers['accept'] = 'text/html';
    next();
};
