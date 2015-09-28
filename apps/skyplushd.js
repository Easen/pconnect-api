var Q = require('q');

var promise;
var getSkyPlusHD = function() {
    if (promise === undefined) {
        promise = Q.Promise(function (resolve, reject, notify) {
            var SkyPlusHD = require('sky-plus-hd');
            var skyFinder = new SkyPlusHD().find();

            skyFinder.then(function (skyBox) {
                resolve(skyBox);
            });
        });
    }
    return promise;
};

var SkyApp = function() {};
SkyApp.prototype = {
    title: function () {
        return 'Sky+ HD';
    },
    actions: function () {
        return {
            pause: {
                title: 'Pause'
            },
            play: {
                title: 'Play'
            },
            fwd: {
                title: 'Fast Forward'
            },
            rew: {
                title: 'Rewind'
            }
        };
    },
    invokeAction: function (action) {
        var self = this;
        return Q.Promise(function (resolve) {
            if (self.actions()[action] === undefined) {
                return resolve(404);
            }
            getSkyPlusHD().then(function (skyBox) {
                skyBox[action].call(this).then(function() {
                    return resolve(202);
                });
            });
        });
    }
};

module.exports.loadApp = Q.Promise(function (resolve) {
    resolve(new SkyApp());
});
