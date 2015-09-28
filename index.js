var hal = require('halberd');
var requireDir = require('require-dir');
var _ = require('underscore');
var restify = require('restify');
var debug = require('debug')('pconnect');

var connectCollection = new hal.Resource({
    title: 'Connect'
}, '/');

var appResources = {};

var renderApp = function(instance, key) {
    var resource = new hal.Resource({
        title: instance.title()
    }, '/app/' + key);

    var actions = [];
    _.each(instance.actions(), function (action, actionKey) {
        var resource = new hal.Resource({
            title: action.title,
            action: true,
        }, '/app/' + key + '/action/' + actionKey);
        actions.push(resource);
    });
    resource.embed('item', actions);
    return resource;
};


var connectApps = {}
_.each(requireDir('./apps'), function (app, key) {
    debug('Loading [%s]', key);

    app.loadApp.then(function (resolvedApps) {
        if (!Array.isArray(resolvedApps)) {
            resolvedApps = [resolvedApps];
        }
        debug('Application [%s] has resolved with [%d] apps instances', key, resolvedApps.length);

        _.each(resolvedApps, function(resolvedApp, index) {
            var appKey = key + '_' + index;
            appResources[appKey] = renderApp(resolvedApp, appKey);
            connectApps[appKey] = resolvedApp;

            // Update the collection
            connectCollection._embedded['item'] = _.values(appResources);

            debug('Added application instance [%s] with key [%s]', resolvedApp.title(), appKey);
        });
    });
});


var app = restify.createServer({
    formatters: {
        'application/hal+json': function formatJSON(req, res, body, cb) {
            if (body instanceof Error) {
                // snoop for RestError or HttpError, but don't rely on
                // instanceof
                res.statusCode = body.statusCode || 500;

                if (body.body) {
                    body = body.body;
                } else {
                    body = {
                        message: body.message
                    };
                }
            } else if (Buffer.isBuffer(body)) {
                body = body.toString('base64');
            }

            var data = JSON.stringify(body, null, '  ');
            res.setHeader('Content-Length', Buffer.byteLength(data));

            return cb(null, data);
        }
    }
});

app.get('/', function (req, res, next) {
    res.send(200, connectCollection);
});

app.get('/app/:app', function (req, res, next) {
    var appResource = appResources[req.params.app];
    if (undefined === appResource) {
        return res.send(404);
    }

    res.setHeader('Content-Type', 'application/hal+json');
    return res.send(200, appResource);
});
app.post('/app/:app/action/:action', function (req, res, next) {
    var app = connectApps[req.params.app];
    if (undefined === app) {
        debug('Cannot find app [%s]', req.params.app);
        return res.send(404);
    }
    debug('Invoking action [%s] for application [%s]', req.params.action, req.params.app);
    app.invokeAction(req.params.action).then(function(code) {
        res.setHeader('Content-Type', 'application/hal+json');
        res.writeHead(code);
        res.end();
        debug('Invoked action [%s] for application [%s]', req.params.action, req.params.app);
    });
    return next();
});

app.listen(8080);
debug('App server up and running');