'use strict';

const url = require('url');
const extend = require('gextend');
const querystring = require('querystring');

const DEFAULTS = {
    skip: 0,
    limit: 10,
    maxPages: 6
};

class Pagination {
    constructor(req, config = {}) {
        this.req = req;
        this.init(config);
    }

    init(options = {}) {
        let config = extend({}, DEFAULTS, options);
        extend(this, config);
    }

    href(prev, params = {}) {
        let query = extend({}, this.req.query);

        if (typeof prev === 'object') {
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

    prev(params = {}) {
        return this.href(true, params);
    }

    next(params = {}) {
        return this.href(false, params);
    }

    getPages(options = {}) {
        let o = extend({}, this.options, options);
        let pages = [];

        let currentPage = this.page,
            limit = this.limit;

        if (limit = 0) {
            return pages;
        }

        /*
         *
         */
        let end = this.totalPages;

        let start = 1;

        let link, active;

        for (var i = start; i <= end; i++) {
            link = this.href().replace('page=' + (currentPage + 1), `page=${i}`);
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

    /**
     * Pagination of more than 7 items:
     * 1 2 [ 3 ] 4 5 ... 12
     * 1 ... 4 [5] 6 ... 12 
     * 2 ... 8 [9] 10 11 12
     */
    slice(options = {}) {
        let pages = this.getPages(options);
        const length = pages.length;

        if (length <= this.maxPages) {
            return pages;
        }

        const emptyLink = {
            active: false,
            index: '...',
            link: '#'
        };

        let out = [];
        
        const firstItem = pages[0];
        const lastItem = pages[length - 1];

        //1 2 [ 3 ] 4 5 ... 12
        if(this.page < this.maxPages ) {
            out = pages.slice(0, this.maxPages - 1);
            out.push(emptyLink);
            out = out.concat(lastItem);
            
            return out;
        }

        /*
         * Add [1, ...] 
         */
        out.push(firstItem);
        out.push(emptyLink);    

        /*
         * 1 ... 4 [5] 6 ... 12 
         * We substract by 2 because we have two 
         * pinned items at either end.
         */
        if(this.page >= this.maxPages && this.page < length - (this.maxPages - 2)) {
            //4 [5] 6 => page - 2 [page] page + 1
            out = out.concat(pages.slice(this.page - 2, this.page + 1));

            out.push(emptyLink);
            out.push(lastItem);

            return out;
        }

        /**
         * 1 ... 8 [9] 10 11 12
         */
        if(this.page > length - this.maxPages) {
            out = out.concat(pages.slice(length - (this.maxPages - 1), length));
            return out;
        }

        return out;
    }

    hasNextPage(totalPages = this.totalPages) {
        return this.page < totalPages;
    }

    hasPrevPage(page = this.page) {
        return this.page > 1;
    }

    get startItemIndex() {
        return this.endItemIndex + 1;
    }

    get endItemIndex() {
        return (this.page - 1) * this.limit;
    }

    get totalItems() {
        return this.count;
    }

    get options() {
        return {
            skip: this.skip,
            limit: this.limit,
            count: this.count,
            totalPages: this.totalPages
        };
    }

    get totalPages() {
        return Math.ceil(this.count / this.limit);
    }

    get page() {
        return this.req.query.page;
    }
    get pages() {
        return this.getPages();
    }
}

Pagination.from = function (req, config = {}) {

    if (req.query.limit < 0) req.query.limit = 0;

    if (req.query.page) {
        req.query.page = parseInt(req.query.page);
        config.skip = req.query.page * config.limit;
    } else if (req.query.skip) {
        req.query.page = req.query.skip / req.query.limit;
    }

    if (!req.query.page) req.query.page = 1;

    if (req.query.page < 1) req.query.page = 1;

    return new Pagination(req, config);
};

module.exports = Pagination;
