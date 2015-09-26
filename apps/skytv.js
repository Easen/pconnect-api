var Q = require('Q');

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
        return 'Sky TV';
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
        return Q.Promise(function (resolve) {
            if (this.actions()[action] === undefined) {
                return resolve(404);
            }
            getSkyPlusHD().then(function (sky) {
                sky[action].call(this);
            });
            return resolve(202);
        });
    }
};

module.exports.loadApp = Q.Promise(function (resolve) {
    resolve(new SkyApp());
});
