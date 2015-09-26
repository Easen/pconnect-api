var hal = require('halberd');
var requireDir = require('require-dir');
var connectApps = requireDir('./apps');
var _ = require('underscore');
var restify = require('restify');

var connectCollection = new hal.Resource({
    title: 'Pebble Connect'
}, '/');

var apps = {};
_.each(connectApps, function (app, key) {
    var resource = new hal.Resource({
        title: app.title
    }, '/app/' + key);

    var actions = [];
    _.each(app.actions, function (action, actionKey) {
        var resource = new hal.Resource({
            title: action.title,
            action: true,
        }, '/app/' + key + '/action/' + actionKey);
        actions.push(resource);
    });

    resource.embed('item', actions);

    apps[key] = resource;
});

connectCollection.embed('item', _.values(apps));

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
    var appResource = apps[req.params.app];
    if (undefined === appResource) {
        return res.send(404);
    }

    res.setHeader('Content-Type', 'application/hal+json');
    return res.send(200, appResource);
});
app.post('/app/:app/action/:action', function (req, res, next) {
    var app = connectApps[req.params.app];
    if (undefined === app) {
        return res.send(404);
    }
    return res.send.apply(res, app.invokeAction(req.params.action));
});

app.listen(8080);