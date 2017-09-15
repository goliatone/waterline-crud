'use strict';

const url = require('url');
const extend = require('gextend');
const querystring = require('querystring');

const DEFAULTS = {
    skip: 0,
    limit: 10,
};

class Pagination {
    constructor(req, config={}){
        this.req = req;
        this.init(config);
    }

    init(options={}){
        let config = extend({}, DEFAULTS, options);
        extend(this, config);
    }

    href(prev, params={}){
        let query = extend({}, this.req.query);

        if(typeof prev === 'object'){
            params = prev;
            prev = false;
        } else {
            prev = (typeof prev === 'boolean') ? prev : false;
            query.page = prev ? query.page -= 1 : query.page += 1;
            query.page = query.page < 1 ? 1 : query.page;
        }

        /*
         * Allow overriding querystring
         * parameters.
         */
        query = extend(query, params);

        return url.parse(this.req.originalUrl).pathname + '?' + querystring.stringify(query);
    }

    prev(params={}){
        return this.href(true, params);
    }

    next(params={}){
        return this.href(false, params);
    }

    getPages(options={}){
        let o = extend({}, this.options, options);
        let pages = [];

        let currentPage = this.page,
            limit = this.limit;

        if(limit = 0){
            return pages;
        }

        /*
         *
         */
        let end = this.totalPages;

        let start = 1;

        let link, active;

        for (var i = start; i <= end; i++) {
            link = this.href().replace('page='+(currentPage + 1), `page=${i}`);
            active = i === currentPage;
            pages.push({
                index: i,
                active: active,
                url: link,
                link: active ? '#' : link
            });
        }

        return pages;
    }

    hasNextPage(totalPages=this.totalPages) {
        return this.page < totalPages;
    }

    hasPrevPage(page=this.page) {
        return this.page > 1;
    }

    get startItemIndex() {
        return this.endItemIndex + 1;
    }

    get endItemIndex(){
        return (this.page - 1) * this.limit;
    }

    get totalItems(){
        return this.count;
    }

    get options(){
        return {
            skip: this.skip,
            limit: this.limit,
            count: this.count,
            totalPages: this.totalPages
        }
    }

    get totalPages(){
        return Math.ceil(this.count / this.limit);
    }

    get page(){
        return this.req.query.page;
    }
    get pages(){
        return this.getPages();
    }
}

Pagination.from = function(req, config={}) {

    if(req.query.limit < 0) req.query.limit = 0;

    if(req.query.page){
        req.query.page = parseInt(req.query.page);
        config.skip = req.query.page * config.limit;
    } else if(req.query.skip){
        req.query.page = req.query.skip / req.query.limit;
    }

    if(!req.query.page) req.query.page = 1;

    if(req.query.page < 1) req.query.page = 1;

    return new Pagination(req, config);
};

module.exports = Pagination;
