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

var skyApp = {
    title: 'Sky TV',
    actions: {
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
    },
    invokeAction: function (action) {
        if (skyApp.actions[action] === undefined) {
            return [404];
        }
        getSkyPlusHD().then(function (sky) {
            sky[action].call(this);
        });
        return [201];
    }
};


module.exports = skyApp;
