var Q = require('q');
var debug = require('debug')('pconnect:sonybravia');

var promise;
var getBravia = function() {
    if (promise === undefined) {
        promise = Q.Promise(function (resolve, reject, notify) {
            var bravia = require('bravia');
            bravia('192.168.1.14', function(client) {
                // List available commands
                client.getCommandNames(function(list) {
                    console.log(list);
                });

                resolve(client);
              });
        });
    }
    return promise;
};

var BraviaApp = function() {};
BraviaApp.prototype = {
    title: function () {
        return 'Sony Bravia TV';
    },
    actions: function () {
        return {
            PowerOn: {
                title: 'Power On'
            },
            PowerOff: {
                title: 'Power Off'
            },
            Mute: {
                title: 'Mute'
            },
            VolumeUp: {
                title: 'Vol +'
            },
            VolumeDown: {
                title: 'Vol -'
            },
            Input: {
                title: 'Input'
            },
            Confirm: {
                title: 'Confirm'
            },
            Return: {
                title: 'Return'
            }
        };
    },
    invokeAction: function (action) {
        debug('Received action [%s]', action);

        var self = this;
        return Q.Promise(function (resolve) {
            if (self.actions()[action] === undefined) {
                return resolve(404);
            }
            getBravia().then(function (tv) {
                tv.exec.call(tv, action);
            });
            return resolve(202);
        });
    }
};

module.exports.loadApp = Q.Promise(function (resolve) {
    resolve(new BraviaApp());
});
