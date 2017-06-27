## Waterline CRUD

Provide CRUD for Waterline models.

To get started:

```
$ npm i waterline-crud
```

### Documentation

Rails like Action Mapping:

* `GET     /<resources>         -> index (list)`
* `GET     /<resources>/new     -> new`
* `POST    /<resources>         -> create`
* `GET     /<resources>/:id     -> show`
* `GET     /<resources>/edit    -> edit`
* `PUT     /<resources>/:id     -> update`
* `DELETE  /<resources>/:id     -> destroy`


#### Scaffold Actions:

API:
- index
- show
- new
- count
- update
- destroy

CRUD:
- list
- create
- view
- edit

API, 6 endpoints:

* `GET     /api/<resource>         -> index`
* `GET     /api/<resource>/count   -> count`
* `GET     /api/<resource>/:id     -> show`
* `POST    /api/<resource>         -> new`
* `PUT     /api/<resource>/:id     -> update`
* `DELETE  /api/<resource>/:id     -> destroy`


CRUD, 4 endpoints:

* `GET     /admin/<resource>           -> list`
* `GET     /admin/<resource>/create    -> create`
* `GET     /admin/<resource>/:id       -> view`
* `GET     /admin/<resource>/:id/edit  -> edit`


### TODO

- [ ] Integrate:
    * [jsonapi](http://jsonapi.org/)
    * [express-paginate-bacon](https://github.com/Pavel-Demidyuk/express-paginate-bacon/blob/master/index.js)

## License
® License MIT by goliatone 2017
